var express = require('express'); 
var ejs = require('ejs'); //embedded javascript template engine

var mongoose = require('mongoose'); // include Mongoose MongoDB library
var schema = mongoose.Schema;

var app = express.createServer(express.logger());

/*********** SERVER CONFIGURATION *****************/
app.configure(function() {
    
    // Configure DB
    app.db = mongoose.connect(process.env.MONGOLAB_URI); //local dev uses .env file
    
    /*********************************************************************************
        Configure the template engine
        We will use EJS (Embedded JavaScript) https://github.com/visionmedia/ejs
        
        Using templates keeps your logic and code separate from your HTML.
        We will render the html templates as needed by passing in the necessary data.
    *********************************************************************************/

    app.set('view engine','ejs');  // use the EJS node module
    app.set('views',__dirname+ '/views'); // use /views as template directory
    app.set('view options',{layout:true}); // use /views/layout.html to manage your main header/footer wrapping template
    app.register('html',require('ejs')); //use .html files in /views

    /******************************************************************
        The /static folder will hold all css, js and image assets.
        These files are static meaning they will not be used by
        NodeJS directly. 
        
        In your html template you will reference these assets
        as yourdomain.heroku.com/img/cats.gif or yourdomain.heroku.com/js/script.js
    ******************************************************************/
    app.use(express.static(__dirname + '/static'));
    
    //parse any http form post
    app.use(express.bodyParser());
    
    /**** Turn on some debugging tools ****/
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

});
/*********** END SERVER CONFIGURATION *****************/

// main page - display the card form
app.get('/', function(request, response) {

    var query = BlogPost.find({});
    query.sort('date',1);
    
    query.exec({}, function(err, allPosts){
        templateData = {
            posts : allPosts
        };
        // render the card_form template with the data above
        response.render('blog_main.html', templateData);
        
    });
    
});
// end of main page


// Display a single blog post
app.get('/entry/:urlslug',function(request, response){
    
    // Get the request blog post by urlslug
    BlogPost.findOne({urlslug:request.params.urlslug},function(err,post){
        if (err) {
            console.log('error');
            console.log(err);
            response.send("uh oh, can't find that post");
        }
        
        // use different layout for single entry view
        post.layout = 'layout_single_entry.html';
        
        // found the blogpost
        response.render('blog_single_entry.html', post);
    });
});


// add a comment to a blog post
app.post('/comment', function(request, response){
    
    // get the comment form's hidden value - urlslug
    var urlslug = request.body.urlslug;
    
    // Query for the blog post with matching urlslug
    BlogPost.findOne({urlslug:urlslug}, function(err,post){
        
        // if there was an error...
        if (err) {
            console.log('There was an error');
            console.log(err);
            
            // display message to user
            response.send("uh oh, can't find that post"); 
        }
        
        // Prepare, save and redirect
        
        // prepare new comment for blog post with the form data
        var commentData = {
            name : request.body.name,
            text : request.body.text
        };
        
        // create new comment
        var comment = new Comment(commentData);
        
        // append the comment to the comment list
        post.comments.push(comment);
        post.save();
        
        // redirect to the blog entry
        response.redirect('/entry/' + urlslug);

    });
    
});




// CREATE A NEW BLOG POST

app.get('/new-entry',function(request, response){
    
    //display the blog post entry form
    response.render('blog_post_entry_form.html');
    
});

// receive a form submission
app.post('/new-entry', function(request, response){
    
    console.log('Received new blog post submission')
    console.log(request.body);
    
    // Prepare the blog post entry form into a data object
    var blogPostData = {
        title : request.body.title,
        urlslug : request.body.urlslug,
        content : request.body.content,
        author : {
            name : request.body.name,
            email : request.body.email
        }
    };
    
    // create a new blog post
    var post = new BlogPost(blogPostData);
    
    // save the blog post
    post.save();
    
    // redirect to show the single post
    response.redirect('/entry/' + blogPostData.urlslug); // for example /entry/this-is-a-post
    
});






// Database Schema Setup
require('./models').configureSchema(schema, mongoose);

//Models
var BlogPost = mongoose.model('BlogPost');
var Comment = mongoose.model('Comment');




// Make server turn on and listen at defined PORT (or port 3000 if is not defined)
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Listening on ' + port);
});