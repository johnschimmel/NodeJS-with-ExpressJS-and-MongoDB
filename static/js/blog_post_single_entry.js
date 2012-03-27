// When the browser has finished loading all HTML, run this.
jQuery(document).ready( function() {
    
    // when the Blog Posts Button is clicked
    jQuery("button#ajaxCommentBtn").click( function(e) {
        
        //serialize the form fields - put them into a string that can be sent to the server
        formData = jQuery("form#commentForm").serialize();
        
        // Alternative way to construct formData
        /*
        formData = {
            name : jQuery("input[name='name']").val(),
            text : jQuery("input[name='text']").val(),
            urlslug : jQuery("input[name='urlslug']").val()
        }
        */
        
        // POST comment via AJAX
        jQuery.ajax({
            
            url : '/comment',
            type : 'POST',
            data : formData, 
            dataType : 'json',
            
            success : function(response) {
                
                if (response.status == "OK") {
                    
                    console.log("comment added successfully, let's display it");
                    displayComment(response.comment);
                    
                }
                
            }, 
            error : function(error) {
                console.log("There was an error");
                console.log(error);
            }
            
        });
        
        // prevent form from submitting as it would normally
        e.preventDefault();
        return false;
        
    });
    
});

var displayComment = function(commentData) {
    
    // generate html for new comment
    var commentHTML = "<div class='comment'><p>";
    commentHTML += "<b>" + commentData.name + " said</b><br>";
    commentHTML += commentData.text;
    commentHTML += "<br><small>right now!</small>";
    commentHTML += "</p></div>";
    
    //append new comment to DOM (rendered browser html)
    jQuery("div#commentsContainer").append(commentHTML);
    
}
