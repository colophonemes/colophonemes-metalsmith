
(function ( $ ) {

	var loadThreshold = 150;

	$.fn.continuousBlog = function (){
		var count = this.length;

		return this.each(function(){
			var el = $(this);
			console.log(el.attr('id'))

			// bind the setter event so we have accurate bounding boxes
			$(window).bind('DOMContentLoaded load resize resetBounds',function(){
				// debouncing...
				clearTimeout($.data(el, 'setBoundsTimer'));
    			$.data(el, 'setBoundsTimer', setTimeout(function() {
					// invoke the setter function
					return setBounds( el );
				}, 100));
			});

			// bind the testing event to window position/scroll events
			$(window).bind('DOMContentLoaded load resize scroll',function(){
				// debouncing...
				clearTimeout($.data(el, 'testBoundsTimer'));
    			$.data(el, 'testBoundsTimer', setTimeout(function() {
					// invoke the testing function
					return testBounds( el );
				}, 100));
			});

			// bind viewport position changes to each post
			$(this).bind('viewportPositionChange',function(){
				el.attr('data-position',el.data('viewportPosition'));
			});

			// bind viewport visibility changes to each post
			$(this).bind('viewportVisibilityChange',function(){
				el.attr('data-visible',el.data('viewportVisible'));

			});

			// bind viewport status changes to each post
			$(this).bind('viewportStatusChange',function(){
				el.attr('data-viewport',el.data('viewportStatus'));
				el.removeClass('current not-current').addClass(el.data('viewportStatus') === 'current' ? 'current' : 'not-current');
			});

			// bind viewport status changes to each post
			$(this).bind('loadContents',function(){
				loadContents( el );
			});



		});
	}


	var setBounds = function(el) {
		var id = $(el).attr('id');
		// var boxTop = 0, boxBottom = 0;
		// $.each(['padding-top','border-top-width','margin-top'],function(index,value){
		// 	boxTop += parseInt( $(el).css(value).replace('px','') );
		// 	boxBottom += parseInt( $(el).css( value.replace('top','bottom') ).replace('px','') );
		// });
		var boundingBox = {
			top: $(el).offset().top,
			bottom: ($(el).next().length ? $(el).next().offset().top : $(el).offset().top + $(el).height() )
		};
		// boundingBox.bottom = boundingBox.top + $(el).outerHeight();
		console.log(id, boundingBox);
		$(el).data('boundingBox',boundingBox);
	};

	var getViewport = function(){
		return {
			top: $(window).scrollTop(),
			middle: $(window).scrollTop() + ($(window).height()/2),
			bottom: $(window).scrollTop() + $(window).height()
		};
	}

	var testBounds = function(el) {
		var viewport = getViewport();
		var boundingBox = $(el).data('boundingBox');
		var id = $(el).attr('id');

		// viewport position
		var oldViewportPosition = $(el).data('viewportPosition');
		var viewportPosition = function(){
			// above viewport
			if(boundingBox.bottom < viewport.top){
				return 'above';
			} 
			// in viewport, top visible
			if(boundingBox.top > viewport.top  && boundingBox.top < viewport.bottom){
				return 'top';
			} 
			// in viewport
			if(boundingBox.top < viewport.top  && boundingBox.bottom > viewport.bottom){
				return 'whole';
			} 
			// in viewport, bottom visible
			if(boundingBox.bottom < viewport.bottom  && boundingBox.bottom > viewport.top){
				return 'bottom';
			} 
			// below viewport
			if(boundingBox.top > viewport.bottom){
				return 'below';
			} 
		}();

		// if the position changes, emit an event
		if(viewportPosition !== oldViewportPosition){
			$(el).data('viewportPosition', viewportPosition);
			$(el).data('viewportVisible', ['above','below'].indexOf(viewportPosition) < 0 ? true : false );
			$(el).trigger({
				type: "viewportPositionChange",
			});
		}

		// viewport status
		var oldViewportStatus = $(el).data('viewportStatus');
		var viewportStatus = function(){
			if( boundingBox.top < viewport.middle && boundingBox.bottom > viewport.middle){
				return 'current';
			} else if (boundingBox.top > viewport.middle) {
				return 'later';
			} else if (boundingBox.bottom < viewport.middle ) {
				return 'earlier';
			}
		}();

		// if the status changes, emit an event
		if(viewportStatus !== oldViewportStatus){
			$(el).data('viewportStatus', viewportStatus);
			$(el).trigger({
				type: "viewportStatusChange"
			});
		}

		// if we're not loaded yet, and we're in range, trigger the load event
			if(boundingBox.top-viewport.bottom < loadThreshold && $(el).attr('data-status')==='placeholder' && $(el).prev().data('viewportStatus')==='current'){
				$(el).trigger({
					type: 'loadContents'
				})
			}
		
	};	

	var loadContents = function ( el ){
		var el = $(el);
		var href = el.attr('data-href');
		console.log('Loading',href);
		el.addClass('loading').attr('data-status','loading');
		setTimeout(function(){
			var request = $.getJSON(href + '/content.json')
				.done(function(data){
					el.append(data.contents);
					el.removeClass('loading').attr('data-status','loaded');
					$(window).trigger({
						type: 'resetBounds'
					});
				})
				.fail(function(){
					console.log('Request for ',href,'failed');
				})
				.always(function(){
					console.log('Request for ',href,'completed');
				});
			},2000);

	};

}( jQuery ));