
// When the browser has finished loading all HTML, run this.
jQuery(document).ready( function() {
    
    // when the Blog Posts Button is clicked -  /ajax example
    jQuery("button#BlogPostsBtn").click( getBlogPosts );
    
    jQuery("button#flickrApiBtn").click( getFlickrPhotos);
    
});


/*************************************************
    getBlogPosts (function)
    -------------------------
    Ajax request for JSON feed /data/allposts
    Retrieves blog posts 
    and passes them to buildBlogPostList
*************************************************/

var getBlogPosts = function(e) {
    
    var jsonURL = "/data/allposts";
     
    jQuery.ajax({
        
        url : jsonURL,
        dataType : 'json',
        type : 'GET',
        
        success : function(data) {
            console.log("inside success callback");
            console.log(data);
            if (data.status == "OK") {
                posts = data.posts;
                
                buildBlogPostList(posts);
            }
        },
        error : function(err) {
            console.log("error fetching blog posts");
        }

    }); // end of jQuery.ajax
} // end of getBlogPosts


/*************************************************
    buildBlogPostList (function)
    -------------------------
    Accepts an array of blog posts
    Builds the HTML to display link and title
    Appends HTML to <ul id="blogposts_list"></ul>
*************************************************/
var buildBlogPostList = function(blogpostsArray) {
    
    // newHTML will be populated with html and appended to the 
    newHTML = "";
    
    // loop through blogpostsArray and create HTML for title and link
    for(i=0; i<blogpostsArray.length; i++) {

        //get the current post in the loop
        currentPost = blogpostsArray[i];

        //build html 
        var tmpHTML = "<li><a href='/entry/"+ currentPost.urlslug +"'>"+currentPost.title+"</a></li>";
        
        // concatenate tmpHTML to the main html string newHTML
        newHTML += tmpHTML;
    }
    
    //append new html to the DOM (browser's rendered HTML)
    jQuery("#blogposts_list").append(newHTML);

}

/***********************************
    JSONP + Flickr Code
************************************/

var getFlickrPhotos = function() {
    var flickrURL = "http://api.flickr.com/services/feeds/photos_public.gne?tagmode=any&format=json";
    var query = jQuery("#flickrQuery").val();
    
    queryURL = flickrURL + "&tags=" + query;
    
    alert(queryURL);
    
    // make ajax call to flickr
    jQuery.ajax({
        
        url : queryURL,
        type : 'GET',
        dataType : 'jsonp',
        jsonp : 'jsoncallback',
        
        success : function(response) {
            console.log("got a response from flickr");
            console.dir(response);

            //display the photos
            displayPhotos(response.items);
        },
        error : function(error) {
            alert("uhoh something happened");
        }
        
        
    })
    
}

var displayPhotos = function(photosArray) {
    
    newHTML = "";
    
    for(i=0; i < photosArray.length; i++) {
        
        currentPhoto = photosArray[i];
        
        tmpHTML = "<li> \
        <img src="+ currentPhoto.media.m + "></li>";
        
        newHTML += tmpHTML;
    }
    
    jQuery("#flickr_container").html(newHTML); // replace current html inside #flickr_container with new image html
    
}