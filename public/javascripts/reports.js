(function(){

// 	$('.card-columns').jscroll({
// 			debug:true,
// 	    loadingHtml: '<span>loading</span>',
// 	    padding: 20,
// 	    nextSelector: 'a.next',
// 	    contentSelector: 'div.card'
// 	});
//
	var ias = jQuery.ias({
	  container:  '.card-columns',
	  item:       '.card',
	  pagination: '.pagination',
	  next:       '.next'
	});
	ias.extension(new IASTriggerExtension({
    // text: 'Load more items', // optionally
}));
	ias.extension(new IASSpinnerExtension({
    // src: '<image source>', // optionally
}));
ias.extension(new IASNoneLeftExtension({text: "You reached the end"}));
})();

(function($) {
		//
    // $.fn.fontFlex = function(min, max, mid) {
		//
    //     var $this = this;
		//
    //     $(window).resize(function() {
		//
    //         var size = window.innerWidth / mid;
		//
    //         if (size < min) size = min;
    //         if (size > max) size = max;
		//
		// 				console.log("fontFlex", window.innerWidth,  mid, size)
		//
    //         $this.css('font-size', size + 'px');
		//
    //     }).trigger('resize');
    // };

})(jQuery);
