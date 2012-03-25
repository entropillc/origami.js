"use strict";

if (!window['Origami']) window.Origami = {
  minimumDragRadius: 10
};

Origami.Container = function(element) {
  var $element = this.$element = $(element);
  
  if (!$element.is('ul')) return null;
  
  element = this.element = $element[0];
  
  var origamiContainer = element.origamiContainer;
  if (origamiContainer) return origamiContainer;
  
  var self = element.origamiContainer = this;
  
  var $activePageElement = this.$activePageElement = $element.children(':first-child').addClass('og-active');
  
  var $window = $(window['addEventListener'] ? window : document.body);
  
  var _isDragging = false;
  var _isFolding = false;
  var _isEasing = false;
  var _startMouseX = -1;
  var _lastMouseX = -1;
  var _deltaX = 0;
  var _minFoldAngle = 0;
  var _maxFoldAngle = 0;
  var _foldingPage = null;
  var _lastTouchIdentifier = 0;
  
  $element.bind('mousedown touchstart', function(evt) {    
    if (_isDragging || _isEasing) return;
    
    _isDragging = true;
    
    if (evt.type === 'touchstart') {
      var targetTouches = evt.targetTouches || evt.originalEvent.targetTouches;
      _startMouseX = _lastMouseX = targetTouches[0].pageX;
      _lastTouchIdentifier = targetTouches[0].identifier;
    } else {
      _startMouseX = _lastMouseX = evt.pageX;
    }
  });
  
  $window.bind('mousemove touchmove', function(evt) {
    if (!_isDragging) return;
    
    var mouseX;
    
    if (evt.type === 'touchmove') {
      var touches = evt.touches || evt.originalEvent.touches;
      var touch = touches[0];
      
      for (var i = 0, length = touches.length; i < length; i++) {
        if (touches[i].identifier === _lastTouchIdentifier) {
          touch = touches[i];
          break;
        }
      }
      
      mouseX = touch.pageX;
    } else {
      mouseX = evt.pageX;
    }
    
    _deltaX = (mouseX - _lastMouseX) / 2;
    
    if (!_isFolding && Math.abs(_startMouseX - mouseX) > Origami.minimumDragRadius) {
      _isFolding = true;
      
      var $newPageElement;
      
      if (_deltaX > 0) {
        $newPageElement = self.$activePageElement.prev();
        _deltaX = _minFoldAngle = 0.2;
        _maxFoldAngle = ($newPageElement.length > 0) ? 179.8 : 1;
        _foldingPage = new Origami.FoldingPage(self.$activePageElement, $newPageElement);
      } else {
        $newPageElement = self.$activePageElement.next();
        _minFoldAngle = ($newPageElement.length > 0) ? -179.8 : -1;
        _deltaX = _maxFoldAngle = -0.2;
        _foldingPage = new Origami.FoldingPage(self.$activePageElement, $newPageElement);
      }
    }
    
    if (_foldingPage) {
      var foldAngle = _foldingPage.foldAngle + _deltaX;
      foldAngle = Math.min(Math.max(foldAngle, _minFoldAngle), _maxFoldAngle);
    
      _foldingPage.setFoldAngle(foldAngle);
    }
    
    _lastMouseX = mouseX;
    
    evt.preventDefault();
  });
  
  $window.bind('mouseup touchend', function(evt) {
    if (!_isDragging || !_foldingPage) return;
    
    _isEasing = true;
    
    var foldAngle = _foldingPage.foldAngle;
    
    if (_minFoldAngle > 0) {
      foldAngle = (foldAngle < 90) ? 0.2 : 179.8;
    } else {
      foldAngle = (foldAngle < -90) ? -179.8 : -0.2;
    }
    
    if ((_minFoldAngle > 0 && foldAngle === 179.8) ||
        (_minFoldAngle < 0 && foldAngle === -179.8)) {
      if (_foldingPage.$newPageElement.length > 0) {
        _foldingPage.$oldPageElement.removeClass('og-active');
        self.$activePageElement = _foldingPage.$newPageElement.addClass('og-active');
      }
    }
    
    // TODO: Determine what the correct prefix is for MSIE.
    _foldingPage.$element.bind('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd transitionEnd', function _transitionEndHandler(evt) {
      _foldingPage.$element.unbind('webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd transitionEnd', _transitionEndHandler);
      
      _foldingPage.$oldPageElement.removeClass('og-transitioning-page');
      _foldingPage.$newPageElement.removeClass('og-transitioning-page');
      _foldingPage.$element.remove();
      
      _foldingPage = null;
      _isEasing = false;
    });
    
    _foldingPage.setFoldAngle(foldAngle, true);
    
    _isDragging = false;
    _isFolding = false;
    _startMouseX = -1;
    _lastMouseX = -1;
    _deltaX = 0;
    _minFoldAngle = 0;
    _maxFoldAngle = 0;
    _lastTouchIdentifier = 0;
  });
};

Origami.Container.prototype = {
  element: null,
  $element: null,
  $activePageElement: null
};

Origami.FoldingPage = function($oldPageElement, $newPageElement) {
  var $element = this.$element = $('<li class="og-folding-page"/>').insertBefore($oldPageElement);
  
  this.$oldPageElement = $oldPageElement.addClass('og-transitioning-page');
  this.$newPageElement = $newPageElement.addClass('og-transitioning-page');
  
  $element.append('<div class="og-folding-page-copy">' + ($oldPageElement.html() || '') + '</div>');
  $element.append('<div class="og-folding-page-copy">' + ($newPageElement.html() || '') + '</div>');
};

Origami.FoldingPage.prototype = {
  $element: null,
  $oldPageElement: null,
  $newPageElement: null,
  foldAngle: 0,
  setFoldAngle: function(foldAngle, useEasing) {
    this.foldAngle = foldAngle;
    
    if (useEasing) {
      this.$element.css({
        '-webkit-transition': '-webkit-transform 0.3s ease',
        '-moz-transition': '-moz-transform 0.3s ease',
        '-ms-transition': '-ms-transform 0.3s ease',
        '-o-transition': '-o-transform 0.3s ease',
        'transition': 'transform 0.3s ease',
        '-webkit-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        '-moz-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        '-ms-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        '-o-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        'transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)'
      });
    } else {
      this.$element.css({
        '-webkit-transition': '-webkit-transform 0.05s linear',
        '-moz-transition': '-moz-transform 0.05s linear',
        '-ms-transition': '-ms-transform 0.05s linear',
        '-o-transition': '-o-transform 0.05s linear',
        'transition': 'transform 0.05s linear',
        '-webkit-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        '-moz-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        '-ms-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        '-o-transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)',
        'transform': 'rotate3d(0, 1, 0, ' + foldAngle + 'deg)'
      });
    }
  },
  forceReflow: function() {
    this.$element[0].offsetWidth;
  }
};

$(function() {
  var $containers = $('.og-container');
  $containers.each(function(index, element) {
    new Origami.Container(element);
  });
});
