This code demonstrates how to use ExpressJS Node Framework with MongoDB on Heroku

## Get the code

### Clone this repository

OR 

### Download Zip file
In terminal run the following commands in this directory to create the Git repository

    git init
    git add .
    git commit -am "init commit"

### .gitignore
Create .gitignore file and put the following into it

    node_modules
    .env
    

---------------

## Install Node Module Dependencies
Install all the Node dependencies listed in package.json run the following command in Terminal

    npm install


---------------

To run locally and deploy to Heroku follow the instructions here http://devcenter.heroku.com/articles/node-js
* Install Heroku toolbelt if you do not already have it installed
* Create a new App on Heroku with the following command

    heroku create --stack cedar

This creates a new App on Heroku and adds a remote path to your Git repository.

---------------

### Add the MongoLabs add-ons
To add MongoLabs as your MongoDB provider run the following command in terminal. This will add the free starter plan MongoLabs offers to Heroku users. Be sure you have verified your Heroku account http://www.heroku.com/verify

    heroku addons:add mongolab:starter
    
Next we need to get the username, password and database URI that MongoLabs has supplied us. Heroku keeps this in the a configuration file. Run the following,

    heroku config | grep MONGOLAB_URI
    
### Create environment configuration file
Create a new blank file called
Create a new 


