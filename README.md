# TableChamp

**Tablesports leaderboard app**
Track each ping pong, pool, foosball, air hockey, or shuffleboard game that's played. Find out who really is number one (in your office, or out of your group of friends).

## What is it?

With TableChamp, you can add players, track every game that is played, and always know who's #1.

![Adding a Score](http://tablechamp.com/img/13.gif)

You can view stats on each player, including their 20 most recent games:

![View Stats](http://tablechamp.com/img/12.gif)

You can manage all of the settings of the app in one convenient sidebar:

![Edit Settings](http://tablechamp.com/img/11.gif)

You can even select from one of 14 languages:

![Translated into 14 languages](http://tablechamp.com/img/10.gif)

## How does it work?

TableChamp is written entirely in JS/HTML/CSS. There is no back-end code (like python, or PHP). It uses [FireBase](https://firebase.google.com/) as a back-end real-time DB to store all of the data, and manage the user authentication.

## Installation

### 1) You'll need a hosting account for the JS/HTML/CSS files

*NOTE: you can run a FireBase app locally, but you'll need to follow [these instructions](https://firebase.google.com/docs/cli/) to get set up with FireBase CLI.*

Just clone this entire project to your server. Once you've done that, move on to step 2.

### 2) You'll need to sign up for a free FireBase account

![FireBase Account Signup](http://tablechamp.com/img/onboarding-step-1.png)

Even if you have a large team, the [free FireBase account](https://firebase.google.com/pricing/) should offer plenty of resources. 

Once you've signed up for a free FireBase account, move on to the next step.

### 3) Create a new FireBase app

![Create a new project](http://tablechamp.com/img/onboarding-step-2.png)

Go through the process of creating a new FireBase Project. You can name it "Table Champ", or anything you'd like.

![Name your app](http://tablechamp.com/img/onboarding-step-3.png)

Find the "Add to your web app" option, and click it:

![web app option](http://tablechamp.com/img/onboarding-step-4.png)

You now have all of the information you need to connect to connect the app to FireBase:

![FireBase API Info](http://tablechamp.com/img/onboarding-step-5.png)

Once you have your FireBase API info, move on to the next step

### 4) Copy your FireBase info to the /js/firebase-key.js file

Open up /js/firebase-key.js:

![Settings file](http://tablechamp.com/img/9.png)

Paste in the FireBase apiKey, authDomain, and databaseURL from step 3 above:

![Competed API settings](http://tablechamp.com/img/8.png)

Once you've done this, save your changes, and move on to the next step.

### 5) Add your first FireBase user

FireBase handles storing all of your data, as well as authentication. We'll need to set up a user in the FireBase admin, so that you can log into your app. I'll walk you through how to add a single user, but you can add as many login users as you'd like.

*NOTE: Users are separate from players. Users are set up in the FireBase admin, and have an email & password attached to them so that you can log in. Players are managed from the settings section once you've logged into your app.*

![Set up your first user](http://tablechamp.com/img/7.gif)

All you need to enter to set up a user is an email, and a password.

Once you've added your first user, continue to the next step.

### 6) Login, and add your players

Now you can log into your app for the first time. Go to the index.html file (wherever it's being hosted from step 1 above). You should see:

![Login screen](http://tablechamp.com/img/6.png)

Once you've logged in, you should see:

![Logged in](http://tablechamp.com/img/5.png)

Enter your organizations name, and the game you'll be tracking:

![Company name](http://tablechamp.com/img/4.png)

Then click on the Players tab:

![Players tab](http://tablechamp.com/img/3.png)

Click "Add Players" and enter the names of your players (one name per line):

![Add players](http://tablechamp.com/img/2.png)

### You're all set

You should be ready to start tracking games:

![All set](http://tablechamp.com/img/1.png)