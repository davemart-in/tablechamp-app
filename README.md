# TableChamp

**Tablesports leaderboard app**
Track each ping pong, pool, foosball, air hockey, or shuffleboard game that's played. Find out who really is number one (in your office, or out of your group of friends).

## What is it?

With TableChamp, you can add players, track every game that is played, and always know who's #1.

![Adding a Score](https://d2ppvlu71ri8gs.cloudfront.net/items/362g0X1J3h213U3S4146/Screen%20Recording%202017-04-22%20at%2006.14%20AM.gif)

You can view stats on each player, including their 20 most recent games:

![View Stats](https://d2ppvlu71ri8gs.cloudfront.net/items/3k3X3N2v0A250h1a2c2p/Screen%20Recording%202017-04-22%20at%2006.15%20AM.gif)

You can manage all of the settings of the app in one convenient sidebar:

![Edit Settings](https://d2ppvlu71ri8gs.cloudfront.net/items/0e0N2B2y3G0h0G3a2p0Q/Screen%20Recording%202017-04-22%20at%2006.17%20AM.gif)

You can even select from one of 14 languages:

![Translated into 14 languages](https://d2ppvlu71ri8gs.cloudfront.net/items/2X1x3s0g3G1W3S0N1R2d/Screen%20Recording%202017-04-22%20at%2006.18%20AM.gif)

## How does it work?

TableChamp is written entirely in JS/HTML/CSS. There is no back-end code (like python, or PHP). It uses [FireBase](https://firebase.google.com/) as a back-end real-time DB to store all of the data, and manage the user authentication.

## Installation

### 1) You'll need a hosting account for the JS/HTML/CSS files

*NOTE: you can run a FireBase app locally, but you'll need to follow ![these instructions](https://firebase.google.com/docs/cli/) to get set up with FireBase CLI.*

Just clone this entire project to your server. Once you've done that, move on to step 2.

### 2) You'll need to sign up for a free FireBase account

![FireBase Account Signup](https://d2ppvlu71ri8gs.cloudfront.net/items/3E3q1u2U3y1r2t0O1C0b/onboarding-step-1.png)

Even if you have a large team, the ![free FireBase account](https://firebase.google.com/pricing/) should offer plenty of resources. 

Once you've signed up for a free FireBase account, move on to the next step.

### 3) Create a new FireBase app

![Create a new project](https://d2ppvlu71ri8gs.cloudfront.net/items/0x3k25290G3U23470p43/onboarding-step-2.png)

Go through the process of creating a new FireBase Project. You can name it "Table Champ", or anything you'd like.

![Name your app](https://d2ppvlu71ri8gs.cloudfront.net/items/2j3q0a14293S350s2I3u/onboarding-step-3.png)

Find the "Add to your web app" option, and click it:

![web app option](https://d2ppvlu71ri8gs.cloudfront.net/items/260m162B0i0U1a270s2O/onboarding-step-4.png)

You now have all of the information you need to connect to connect the app to FireBase:

![FireBase API Info](https://d2ppvlu71ri8gs.cloudfront.net/items/460I1t2R283y2Q2M031I/onboarding-step-5.png)

Once you have your FireBase API info, move on to the next step

### 4) Copy your FireBase info to the /js/firebase-key.js file

Open up /js/firebase-key.js:

![Settings file](https://d2ppvlu71ri8gs.cloudfront.net/items/311R201v1V1t3B1s1K3A/Screen%20Shot%202017-04-22%20at%206.49.25%20AM.png)

Paste in the FireBase apiKey, authDomain, and databaseURL from step 3 above:

![Competed API settings](https://d2ppvlu71ri8gs.cloudfront.net/items/191C0s3u1M250h0Y0V3M/Screen%20Shot%202017-04-22%20at%206.52.07%20AM.png)

Once you've done this, save your changes, and move on to the next step.

### 5) Add your first FireBase user

FireBase handles storing all of your data, as well as authentication. We'll need to set up a user in the FireBase admin, so that you can log into your app. I'll walk you through how to add a single user, but you can add as many login users as you'd like.

*NOTE: Users are separate from players. Users are set up in the FireBase admin, and have an email & password attached to them so that you can log in. Players are managed from the settings section once you've logged into your app.*

![Set up your first user](https://d2ppvlu71ri8gs.cloudfront.net/items/3N1s0Z2z0W2c2g2Q2E2u/Screen%20Recording%202017-04-22%20at%2006.58%20AM.gif)

All you need to enter to set up a user is an email, and a password.

Once you've added your first user, continue to the next step.

### 6) Login, and add your players

Now you can log into your app for the first time. Go to the index.html file (wherever it's being hosted from step 1 above). You should see:

![Login screen](https://d2ppvlu71ri8gs.cloudfront.net/items/3G2K2W1P2P2i1b2A0g06/Screen%20Shot%202017-04-22%20at%207.04.33%20AM.png)

Once you've logged in, you should see:

![Logged in](https://d2ppvlu71ri8gs.cloudfront.net/items/192Z2E09012V3z3t0v3b/Screen%20Shot%202017-04-22%20at%207.05.32%20AM.png)

Enter your organizations name, and the game you'll be tracking:

![Company name](https://d2ppvlu71ri8gs.cloudfront.net/items/0Y0u0X0t3m0D1l0N3v2Z/Screen%20Shot%202017-04-22%20at%207.06.45%20AM.png)

Then click on the Players tab:

![Players tab](https://d2ppvlu71ri8gs.cloudfront.net/items/0i1a3U1g1Q3d2N2x3G2w/Screen%20Shot%202017-04-22%20at%207.07.48%20AM.png)

Click "Add Players" and enter the names of your players (one name per line):

![Add players](https://d2ppvlu71ri8gs.cloudfront.net/items/36303h462E0b0v1z2o3e/Screen%20Shot%202017-04-22%20at%207.09.40%20AM.png)

### You're all set

You should be ready to start tracking games:

![All set](https://d2ppvlu71ri8gs.cloudfront.net/items/2P0y0x441n28213x0a10/Screen%20Shot%202017-04-22%20at%207.10.50%20AM.png)