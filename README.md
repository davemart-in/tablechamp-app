# TableChamp

**Tablesports leaderboard app**
Track each ping pong, pool, foosball, air hockey, or shuffleboard game that's played. Find out who really is number one (in your office, or out of your group of friends).

## What is it?

With TableChamp, you can add players, track every game that is played, and always know who's #1.

![image](https://user-images.githubusercontent.com/5634774/209989063-d69c98e7-5a02-4aea-a29c-7939eaccdb67.png)

You can view stats on each player, including their 20 most recent games:

![image](https://user-images.githubusercontent.com/5634774/209989109-d596a65c-e4b5-4b7c-85bd-af77c69ba28a.png)

You can manage all of the settings of the app in one convenient sidebar:

![image](https://user-images.githubusercontent.com/5634774/209989132-9bcb39b5-f886-418d-9d2b-4b98f52be443.png)

You can even select from one of 14 languages:

![image](https://user-images.githubusercontent.com/5634774/209989151-7bc52703-c2b2-40d4-9d93-25caad73651e.png)

## How does it work?

TableChamp is written entirely in JS/HTML/CSS. There is no back-end code (like python, or PHP). It uses [FireBase](https://firebase.google.com/) as a back-end real-time DB to store all of the data, and manage the user authentication.

## Installation

### 1) You'll need a hosting account for the JS/HTML/CSS files

*NOTE: you can run a FireBase app locally, but you'll need to follow [these instructions](https://firebase.google.com/docs/cli/) to get set up with FireBase CLI.*

Just clone this entire project to your server. Once you've done that, move on to step 2.

### 2) You'll need to sign up for a free FireBase account

![image](https://user-images.githubusercontent.com/5634774/209989202-dd871ea4-9d37-4cec-acfc-04a234b3a054.png)

Even if you have a large team, the [free FireBase account](https://firebase.google.com/pricing/) should offer plenty of resources. 

Once you've signed up for a free FireBase account, move on to the next step.

### 3) Create a new FireBase app

![image](https://user-images.githubusercontent.com/5634774/209989227-9b39abc3-0982-4644-8dad-229444578de3.png)

Go through the process of creating a new FireBase Project. You can name it "Table Champ", or anything you'd like.

![image](https://user-images.githubusercontent.com/5634774/209989248-cde54bd5-1ae6-4167-9cef-4afe74b772f2.png)

Find the "Add to your web app" option, and click it:

![image](https://user-images.githubusercontent.com/5634774/209989282-0bddb656-3d8a-4f8b-80f2-023c27b47a92.png)

You now have all of the information you need to connect to connect the app to FireBase:

![image](https://user-images.githubusercontent.com/5634774/209989305-61353e80-c2ac-4a84-a498-e7045ad52497.png)

Once you have your FireBase API info, move on to the next step

### 4) Copy your FireBase info to the /js/firebase-key.js file

Open up /js/firebase-key.js:

![image](https://user-images.githubusercontent.com/5634774/209989350-46f75d12-1c10-4876-ac20-a952187c4776.png)

Paste in the FireBase apiKey, authDomain, and databaseURL from step 3 above:

![image](https://user-images.githubusercontent.com/5634774/209989379-697262d7-b840-4cd8-b43b-2b6c7ada3de7.png)

Once you've done this, save your changes, and move on to the next step.

### 5) Add your first FireBase user

FireBase handles storing all of your data, as well as authentication. We'll need to set up a user in the FireBase admin, so that you can log into your app. I'll walk you through how to add a single user, but you can add as many login users as you'd like.

*NOTE: Users are separate from players. Users are set up in the FireBase admin, and have an email & password attached to them so that you can log in. Players are managed from the settings section once you've logged into your app.*

![image](https://user-images.githubusercontent.com/5634774/209989411-eb9e5ebb-9bb2-43d0-b07a-1b7acd4d611a.png)

All you need to enter to set up a user is an email, and a password.

Once you've added your first user, continue to the next step.

### 6) Create a database instance

From your FireBase console, click into the Database section:

![image](https://user-images.githubusercontent.com/5634774/209989434-a26f87aa-1edf-432e-bb1e-13f7b88f9452.png)

Create a new "Real-time database" (not a Firestore DB - note: they try and get you to create a Firestore DB by default).

Once you've created your real-time DB, you'll need to change the security rules. Click the "Rules" tab and and replace what's there with the following:

```
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Here's what it should look like:

![image](https://user-images.githubusercontent.com/5634774/209989458-fcf26eff-f4e5-435f-a924-2c1f1801e6bb.png)

### 7) Login, and add your players

Now you can log into your app for the first time. Go to the index.html file (wherever it's being hosted from step 1 above). You should see:

![image](https://user-images.githubusercontent.com/5634774/209989476-ae42d4aa-52bb-4bd8-a08b-18411ae20322.png)

Once you've logged in, you should see:

![image](https://user-images.githubusercontent.com/5634774/209989493-24762c7f-3e4d-46a7-8004-ea667dccb191.png)

Enter your organizations name, and the game you'll be tracking:

![image](https://user-images.githubusercontent.com/5634774/209989511-91ee0983-dba4-4b7b-ab01-1ff05ddac187.png)

Then click on the Players tab:

![image](https://user-images.githubusercontent.com/5634774/209989531-0dc04a4f-a23b-4bf9-ad2c-50dccbb3ddf7.png)

Click "Add Players" and enter the names of your players (one name per line):

![image](https://user-images.githubusercontent.com/5634774/209989548-2fb8f956-ec47-4dde-a9d8-3b291fcc6247.png)

### You're all set

You should be ready to start tracking games:

![image](https://user-images.githubusercontent.com/5634774/209989569-46f0f20d-09ed-4c90-9f99-bc54e0fb5b72.png)
