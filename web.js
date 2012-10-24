var express = require('express'); 
var ejs = require('ejs'); //embedded javascript template engine

var app = express.createServer(express.logger());

var mongoose = require('mongoose'); // include Mongoose MongoDB library
var schema = mongoose.Schema; 

var requestURL = require('request');
var moment = require('moment');
/************ DATABASE CONFIGURATION **********/
app.db = mongoose.connect(process.env.MONGOLAB_URI); //connect to the mongolabs database - local server uses .env file

// Include models.js - this file includes the database schema and defines the models used
require('./models').configureSchema(schema, mongoose);

// Define your DB Model variables
var BlogPost = mongoose.model('BlogPost');
var Comment = mongoose.model('Comment');
/************* END DATABASE CONFIGURATION *********/


/*********** SERVER CONFIGURATION *****************/
app.configure(function() {
    
    
    /*********************************************************************************
        Configure the template engine
        We will use EJS (Embedded JavaScript) https://github.com/visionmedia/ejs
        
        Using templates keeps your logic and code separate from your HTML.
        We will render the html templates as needed by passing in the necessary data.
    *********************************************************************************/

    app.set('view engine','ejs');  // use the EJS node module
    app.set('views',__dirname+ '/views'); // use /views as template directory
    app.set('view options',{layout:true}); // use /views/layout.html to manage your main header/footer wrapping template
    
    app.set( "jsonp callback", true );
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



// main page - display all blog posts
// More Mongoose query information here - http://mongoosejs.com/docs/finding-documents.html
app.get('/', function(request, response) {

    // build the query
    var query = BlogPost.find({});
    query.sort('date',-1); //sort by date in descending order
    
    // run the query and display blog_main.html template if successful
    query.exec({}, function(err, allPosts){
        
        // prepare template data
        templateData = {
            posts : allPosts
        };
        
        // render the card_form template with the data above
        response.render('blog_main.html', templateData);
        
    });
    
});
// end of main page
app.get('/testembed', function(req, res){
    
    BlogPost.findById('4f55bf0ad579ec0100000002', function(err, blogpost){
        blogpost.comments.id('4f67b90776dd2e010000001a').text = "tuna fish sandwich";
        blogpost.save();
        
        comment = blogpost.comments.id('4f67b90776dd2e010000001a')
        res.json(comment._id);
    })
    
});

// Display a single blog post
app.get('/entry/:urlslug',function(request, response){
    
    // Get the request blog post by urlslug
    BlogPost.findOne({ urlslug : request.params.urlslug },function(err, blogpost){
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {

            // use different layout for single entry view
            blogpost.layout = 'layout_single_entry.html';
        
            // found the blogpost
            response.render('blog_single_entry.html', blogpost);
        }
    });
});

// .findById example
// Get a blogpost by its unique objectId (._id)
app.get("/entryById/:postId", function(request, response) {
    
    var requestedPostID = request.params.postId;
    
    BlogPost.findById( requestedPostID, function(err, blogpost) {
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {

            // use different layout for single entry view
            blogpost.layout = 'layout_single_entry.html';
        
            // found the blogpost
            response.render('blog_single_entry.html', blogpost);
        }
        
    })
    
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
        
        if (request.xhr) {
            
            response.json({
                status :'OK',
                comment : {
                    name : commentData.name,
                    text : commentData.text
                }
            });
            
        } else {
            
            // redirect to the blog entry
            response.redirect('/entry/' + urlslug);

        }

    });
    
});




// CREATE A NEW BLOG POST

app.get('/new-entry',function(request, response){
    
    //display the blog post entry form
    response.render('blog_post_entry_form.html');
    
});

// receive a form submission
app.post('/new-entry', function(request, response){
    
    console.log('Received new blog post submission');
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

app.get("/recent", function(request, response){
    
    // create date variable for 7 days ago
    var lastWeek = new Date();
    lastWeek.setDate(-7);
    
    // query for all blog posts where the date is greater than or equal to 7 days ago
    var query = BlogPost.find({ date : { $gte: lastWeek }});

    query.sort('date',-1);
    query.exec(function (err, recentPosts) {

      
      // prepare template data
      templateData = {
          posts : recentPosts
      };
      
      // render the card_form template with the data above
      response.render('recent_posts.html', templateData);
      
    });
    
});

app.get("/entryById/:postId", function(request, response) {
    
    var requestedPostID = request.params.postId;
    
    BlogPost.findById( requestedPostID, function(err, blogpost) {
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {

            // use different layout for single entry view
            blogpost.layout = 'layout_single_entry.html';
        
            // found the blogpost
            response.render('blog_single_entry.html', blogpost);
        }
        
    })
    
});


app.get("/update/:postId", function(request, response){
    
    // get the request blog post id
    var requestedPostID = request.params.postId;
    
    // find the requested document
    BlogPost.findById( requestedPostID, function(err, blogpost) {
        
        if (err) {
            console.log(err);
            response.send("an error occurred!");
        }
        
        if (blogpost == null ) {
            console.log('post not found');
            response.send("uh oh, can't find that post");

        } else {
            
            // prepare template data
            // blogpost data & updated (was this entry updated ?update=true)
            templateData = {
                blogpost : blogpost,
                updated : request.query.update
            };
            
            // found the blogpost
            response.render('blog_post_entry_update.html', templateData);
        }
        
    })
    
});

app.post("/update", function(request, response){
    
    // update post body should have form element called blog_post_id
    var postid = request.body.blog_post_id;

    // we are looking for the BlogPost document where _id == postid
    var condition = { _id : postid };
    
    // update these fields with new values
    var updatedData = {
        title : request.body.title,
        content : request.body.content,
        author : {
            name : request.body.name,
            email : request.body.email
        }
    };
    
    // we only want to update a single document
    var options = { multi : false };
    
    // Perform the document update
    // find the document with 'condition'
    // include data to update with 'updatedData'
    // extra options - this time we only want a single doc to update
    // after updating run the callback function - return err and numAffected
    
    BlogPost.update( condition, updatedData, options, function(err, numAffected){
        
        if (err) {
            console.log('Update Error Occurred');
            response.send('Update Error Occurred ' + err);

        } else {
            
            console.log("update succeeded");
            console.log(numAffected + " document(s) updated");
            
            //redirect the user to the update page - append ?update=true to URL
            response.redirect('/update/' + postid + "?update=true");
            
        }
    });
    
});


/*********** API & JSON EXAMPLES ************/

// return all blog entries in json format
app.get('/data/allposts', function(request, response){
    
    // define the fields you want to include in your json data
    includeFields = ['title','content','urlslug','date','comments','author.name']
    
    // query for all blog
    queryConditions = {}; //empty conditions - return everything
    var query = BlogPost.find( queryConditions, includeFields);

    query.sort('date',-1); //sort by most recent
    query.exec(function (err, blogPosts) {

        // render the card_form template with the data above
        jsonData = {
          'status' : 'OK',
          'posts' : blogPosts
        }

        response.json(jsonData);
    });
});

app.get('/simplejson', function(request, response){
    
    data = {
        "offset" : "0",
        "results" : [
        {
        "body": "Article Body",
        "date" : "Article Data",
        "title" : "Article Title",
        "url" :"Article URL"
        }
        ],
        "tokens" : ["O", "J", "Simpson"],
        "total": 2218
    };
    
    response.json(data);
    
})

// This is a demonstration of using "remote" JSON data.
app.get('/jsontest',function(request, response) {
    
    // define the remote JSON feed
    blogPostsURL= "http://dwd-mongodb.herokuapp.com/data/allposts"; //pretend this url is actually on another server
    
    // make the request
    requestURL(blogPostsURL, function(error, httpResponse, data) {
        //if there is an error
        if (error) {
            console.error(error);
            response.send("uhoh there was an error");
        }

        // if successful HTTP 200 response
        if (httpResponse.statusCode == 200) {
            
            //convert JSON into native javascript
            blogPostData = JSON.parse(data);
            
            if (blogPostData.status == "OK") {
                posts = blogPostData.posts;
                
                //render template with remote data
                templateData = {
                    blogposts : posts, 
                    source_url : blogPostsURL   
                }
                response.render("remote_json_example.html",templateData)
            } else {
                
                response.send("blog post JSON status != OK");
            }
        }
    }); // end of requestURL callback
}); //end of /jsontest route

/************ YAHOO  WEATHER EXAMPLE **************/
app.get('/weather', function(request, response){
    
    // default /weather request - redirect to /weather/NYC
    response.redirect("/weather/nyc");
    
});

app.get('/weather/:location', function(request, response){
    
    // Yahoo Where On Earth ID ( WOEID )
    // look up more locations here http://woeid.rosselliot.co.nz/lookup/shanghai
    YAHOOLocations = {
        'nyc' : 2459115,
        'berlin' : 638242,
        'shanghai' : 2151849
    }

    // convert incoming location parameter to lowercase
    requestedLocation = request.params.location.toLowerCase();
    
    // lookup the location in YAHOOLocations
    if (requestedLocation in YAHOOLocations ) {
        woeid = YAHOOLocations[requestedLocation];
    } else {
        woeid = YAHOOLocations['nyc'] // default to nyc
    }
    
    // build the request URL
    yahooWeatherURL = "http://weather.yahooapis.com/forecastjson?w=" + woeid;
    
    // make the request
    requestURL(yahooWeatherURL, function(err, httpResponse, data) {
        
        if (err || httpResponse.statusCode != 200) {
            console.log(err);
            response.send("Something went wrong");
        }
        
        if (httpResponse.statusCode == 200) {
            
            //convert JSON string into JS Object
            weatherData = JSON.parse(data);
            
            console.log("-------- DATA RECEIVED -------");
            console.log(data);
            console.log("------------------------------");
            
            templateData = {
                jsonFromYahoo : data,
                weather : weatherData,
                requestedURL : yahooWeatherURL, 
                YAHOOLocations : YAHOOLocations
            }
            
            response.render('weather_from_yahoo.html', templateData);
        }
        
        
    })
    
});


// AJAX Example Page
app.get("/ajax", function(request, response){
    
    // use the layout --> layout_ajax.html, includes the ajax_example.js script
    templateData = {
        layout:'layout_ajax.html'
    };
    
    //render the template 
    response.render("ajax_example.html", templateData);
    
});



// AJAX JSONP Example
app.get("/jsonp", function(request, response){
    
    // use the layout --> layout_ajax.html, includes the ajax_example.js script
    templateData = {
        layout:'layout_ajax.html'
    };
    
    //render the template 
    response.render("ajax_jsonp_example.html", templateData);
    
})


// Make server turn on and listen at defined PORT (or port 3000 if is not defined)
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Listening on ' + port);
});