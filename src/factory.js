angular.module("webodf.factory", [])
.factory("Canvas", [
  "$window",
  function($window) {
    var data = {};
    var $scope;
    var canvas;
    var ruler;
    var toolbar;
    var webOdfCanvas;

    var eventNotifier = new core.EventNotifier([
        "unknownError",
        "metadataChanged" 
    ]);

    var initSession = function(container) {
      if (data.session) return;

      data.session = new ops.Session(data.canvas);
      var doc = data.session.getOdtDocument();
      var cursor = new gui.ShadowCursor(doc);
      data.sessionController = new gui.SessionController(data.session, data.memberId, cursor, {
        annotationsEnabled: true,
        directTextStylingEnabled: true, 
        directParagraphStylingEnabled: true
      });

      var viewOptions = {
        editInfoMarkersInitiallyVisible: false,
        caretAvatarsInitiallyVisible: false,
        caretBlinksOnRangeSelect: true
      };
      var caretManager = new gui.CaretManager(data.sessionController, data.canvas.getViewport());
      var selectionViewManager = new gui.SelectionViewManager(gui.SvgSelectionView);
      var sessionConstraints = data.sessionController.getSessionConstraints();
      data.sessionView = new gui.SessionView(viewOptions, data.memberId, data.session, sessionConstraints, caretManager, selectionViewManager);
      selectionViewManager.registerCursor(cursor, true);

      data.sessionController.getMetadataController().subscribe(gui.MetadataController.signalMetadataChanged, function(changes) {
        eventNotifier.emit("metadataChanged", changes);
      });

      var op = new ops.OpAddMember();
      op.init({
        memberid: data.memberId,
        setProperties: {
          fullName: "",
          color: "black",
          imageUrl: ""
        }
      });
      data.session.enqueue([op]);

      data.sessionController.insertLocalCursor();
      data.sessionController.startEditing();
      $scope.editable = true;

      canvas.width = webOdfCanvas.clientWidth + 1;
      canvas.height = 15;
      ruler.render("#aaa", "cm", 100);
    }

    var init = function(scope, element) {
      $scope = scope;
      $scope.data = data;
      var list = element.find("div");
      webOdfCanvas = angular.element(list)[1];
      toolbar = angular.element(list)[0];
      canvas = angular.element(element.find("canvas"))[0];
      if (!webOdfCanvas) return;

      ruler = new Ruler(canvas);
      webOdfCanvas.addEventListener("resize", function() {
        element[0].width = webOdfCanvas.clientWidth;
        element[0].height = webOdfCanvas.clientHeight;
        canvas.width = webOdfCanvas.clientWidth + 1;
        canvas.height = 15;
        ruler.render("#aaa", "cm", 100);
      });
      data.canvas = new odf.OdfCanvas(webOdfCanvas); 
      $scope.editable = false;
      if (!data.readOnly) {
        data.canvas.addListener("statereadychange", initSession);
      }

      if (data.loadUrl) {
        $scope.loaded = true;
        data.canvas.load(data.loadUrl);
      }
    }

    return function() {
      return {
      init: init,
      data: data
      }
    }
  }
])
