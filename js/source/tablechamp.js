(function ($) {
    'use strict'
    var auth,
        fbdb,
        isOnline = true,
        lastGame = {},
        logging = false,
        messageTimer,
        modalTimer,
        scoringEventsTimer;
    // last game player data key
    lastGame.game = [];
    // localData Object
    var localData = {};
        localData.settings = {};
    // ---------------------------------------------------
    // Ready
    // ---------------------------------------------------
    $(window).load(function(){
        // Load FireBase Settings
        var config = {
            apiKey: cs.apiKey,
            authDomain: cs.authDomain,
            databaseURL: cs.databaseURL
        };
        firebase.initializeApp(config);
        auth = firebase.auth();
        fbdb = firebase.database();
        init();
    });
    function init() {
        // Make sure they're logged in
        auth.onAuthStateChanged(function(user) {
            if (!user) {
                window.location = "./index.html";
            }
        });
        initLoader();
        initHeader();
        initEvents();
        initSettingsListener();
        initPlayersListener();
        initOfflineDetect();
        sidebarInit();        
        renderHistoricalGames();
        initGooglePlotPackage();
    }
    function initHeader() {
        $('.app header').html(tmpl('appHeader', {
            "addScore" : i18n.app.appHeader.addScore,
            "doubles" : i18n.app.appHeader.doubles,
            "logOut" : i18n.app.appHeader.logOut,
            "settings" : i18n.app.appHeader.settings
        }));
        $('.app .name').on('click', function() {
            sidebarShow();
            return false;
        });

        $('#showUnranked').on('click', function() {
            if ($('#showUnranked').hasClass('hidden'))
            {
                $('.ranking.unranked').slideDown('slow');
            }
            else
            {
                $('.ranking.unranked').slideUp('fast');
            }
            $('#showUnranked').toggleClass('hidden'); 
        });
    }
    function initLoader() {
        $('.loader').html(tmpl('loader', {
            "loading" : i18n.app.loader.loading
        }));
    }
    // ---------------------------------------------------
    // Events
    // ---------------------------------------------------
    function initEvents() {
        // Log out
        $('.logout').on('click', function() {
            auth.signOut().then(function() {
                window.location = "./index.html#logout";
            }, function(error) {
                console.log('Failed to log out');
            });
            return false;
        });
        // Settings Link
        $('.settings').on('click', function() {
            sidebarToggle();
            return false;
        });
        // Add Score
        $('.add-score').on('click', function() {
        
            // Hide sidebar if it's showing
            $('body').removeClass('show-sidebar');
            // Show stats modal
            modalShow();
            // Populate from JS template
            $('.modal').html(tmpl('scoreAdd', {
                "addScoreButton" : i18n.app.scoreAdd.addScoreButton,
                "addScoreTitle" : i18n.app.scoreAdd.addScoreTitle,
                "teamOnePlayers" : i18n.app.scoreAdd.teamOnePlayers,
                "teamOneScore" : i18n.app.scoreAdd.teamOneScore,
                "teamTwoPlayers" : i18n.app.scoreAdd.teamTwoPlayers,
                "teamTwoScore" : i18n.app.scoreAdd.teamTwoScore
            }));

            Pager.setToObject("pager");
            // Update add score player selection
            scoringPopulatePlayerSelection();
            // Player select event
            $('.players-select a').off('click').on('click', function () {
                if (!$(this).hasClass('is-disabled')) {
                    $(this).toggleClass('selected');
                }
                return false;
            });
            return false;
        });
    }
    // ---------------------------------------------------
    // Offline
    // ---------------------------------------------------
    function initOfflineDetect() {
        setTimeout(function() {
            var connectedRef = firebase.database().ref(".info/connected");
            connectedRef.on("value", function(snap) {
                if (snap.val() === false) {
                    messageShow('warning', i18n.app.messages.notConnected + '...', true);
                    isOnline = false;
                } else {
                    isOnline = true;
                }
            });
        }, 2000);
    }
    // ---------------------------------------------------
    // Onboarding
    // ---------------------------------------------------
    function initOnboarding() {
        // Sidebar
        sidebarToggle();
    }
    // ---------------------------------------------------
    // Listeners
    // ---------------------------------------------------
    function initPlayersListener() {
        fbdb.ref('/players/').on('value', function(snapshot) {
            localDataUpdate(snapshot.val());
            rankingsUpdate();
            rankingsEvents();            
            renderHistoricalGames();
        });
    }
    function initSettingsListener() {
        fbdb.ref('/settings/').on('value', function(snapshot) {
            // Update local data set
            localSettingsUpdate(snapshot.val());
            
            // Update org name
            sidebarBasicSettingsUpdate();
            // Hide loader if it's still showing
            var loader = $('.loader');
            if (loader.is(':visible')) {
                $('.app header').show();
                loader.fadeOut();
            }
        });
    }
    function initUndo() {
        $('.undo').off('click').on('click', function () {
            // Undo game/player scores
            for (var i = 0; i < lastGame.players.scores.length; i++) {
                var data = lastGame.players.scores[i],
                    player = data.player,
                    type = lastGame.players.type,
                    key = data.key,
                    points = data.pointsNew - data.lastMovement,
                    movement = '',
                    lost, won;
                if (data.won) {
                    lost = data.gamesLost,
                    won = parseInt(data.gamesWon, 10) - 1;
                    if (won < 0) {
                        won = 0;
                    }
                } else {
                    lost = parseInt(data.gamesLost, 10) - 1,
                    won = data.gamesWon;
                    if (lost < 0) {
                        lost = 0;
                    }
                }
                scoringUndo(player, type, key, points, movement, lost, won);
            }
            messageShow('success', i18n.app.messages.gameUndone, true);
        });
    }
    // ---------------------------------------------------
    // Copy of JSON locally
    // ---------------------------------------------------
    function localDataUpdate(data) {
        // Reset everything
        localData.mostGamesByOnePlayer = -1;
        localData.mostGamesWonOrLostByOnePlayer = -1;
        localData.bestGoalsForAverage = -1;
        localData.worstGoalsAgainstAverage = -1;
        localData.playersArray = [];
        localData.playersByDoubles = [];
        localData.playersByKey = {};
        // Update localData.playersByKey
        localData.playersByKey = data;
        // Assemble playerList array
        for (var key in localData.playersByKey) {
            if (localData.playersByKey.hasOwnProperty(key)) {
                var gamesCount =  localData.playersByKey[key].doubles_lost + localData.playersByKey[key].doubles_won;
                var isRanked = gamesCount >= 7; // as we usually play only 6 games at once
                var goalsForAverage = (gamesCount > 0) ? localData.playersByKey[key].doubles_goals_for/gamesCount : 0;
                var goalsAgainstAverage = (gamesCount > 0) ? localData.playersByKey[key].doubles_goals_against/gamesCount : 0;

                localData.playersArray.push({
                    "doubles_last_movement": localData.playersByKey[key].doubles_last_movement,
                    "doubles_lost": localData.playersByKey[key].doubles_lost,
                    "doubles_points": localData.playersByKey[key].doubles_points,
                    "doubles_won": localData.playersByKey[key].doubles_won,
                    "doubles_goals_for": localData.playersByKey[key].doubles_goals_for,
                    "doubles_goals_against": localData.playersByKey[key].doubles_goals_against,
                    "doubles_goals_for_avg": goalsForAverage,
                    "doubles_goals_against_avg": goalsAgainstAverage,
                    "dt": localData.playersByKey[key].dt,
                    "key": key,
                    "name": localData.playersByKey[key].name,
                    "status": localData.playersByKey[key].status,
                    "isRanked": isRanked,
                    "gamesCount": gamesCount
                });

                if (isRanked)
                {
                    if (gamesCount > localData.mostGamesByOnePlayer){
                        localData.mostGamesByOnePlayer = gamesCount;
                    }
                    if (localData.playersByKey[key].doubles_won > localData.mostGamesWonOrLostByOnePlayer){
                        localData.mostGamesWonOrLostByOnePlayer = localData.playersByKey[key].doubles_won;
                    }
                    if (localData.playersByKey[key].doubles_lost > localData.mostGamesWonOrLostByOnePlayer){
                        localData.mostGamesWonOrLostByOnePlayer = localData.playersByKey[key].doubles_lost;
                    }
                    if (goalsForAverage > localData.bestGoalsForAverage){
                        localData.bestGoalsForAverage = goalsForAverage;
                    }
                    if (goalsAgainstAverage > localData.worstGoalsAgainstAverage){
                        localData.worstGoalsAgainstAverage = goalsAgainstAverage;
                    }
                }
            }
        }
        localData.playersArray = localData.playersArray.slice(0);
        localData.playersArray.sort(function(a,b) {
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();
            return x < y ? -1 : x > y ? 1 : 0;
        });
        // Sort by games array
        localData.playersByDoubles = localData.playersArray.slice(0);
        localData.playersByDoubles.sort(function(a,b) {
            if(a.isRanked && !b.isRanked){
                return -1;
            }else if(!a.isRanked && b.isRanked){
                return 1;
            }
            return b.doubles_points - a.doubles_points;
        });
        // Add games rank to array
        var gamesCount = 0;
        for (var i = 0; i < localData.playersByDoubles.length; i++) {
            gamesCount++;
            localData.playersByDoubles[i]['doubles_rank'] = gamesCount;
            localData.playersByKey[localData.playersByDoubles[i]['key']].doubles_rank = gamesCount;
        }        
    }

    function localSettingsUpdate(data) {
        // Blank slate
        if (null === data) {
            return initOnboarding();
        }
        localData.settings.orgName = (typeof data.orgName !== 'undefined') ? data.orgName : '';
        localData.settings.gameType = (typeof data.gameType !== 'undefined') ? data.gameType : '';
    }
    // ---------------------------------------------------
    // Messages
    // ---------------------------------------------------
    function messageShow(type, txt, autoHide) {
        var message = $('.message');
        message.html(txt).addClass('show');
        if (autoHide) {
            clearTimeout(messageTimer);
            messageTimer = setTimeout(function () {
                message.removeClass('show');
            }, 7000);
        }
    }
    // ---------------------------------------------------
    // Modal
    // ---------------------------------------------------
    function modalEvents() {
        $('.modal-close, .modal-backdrop').off('click').on('click', function() {
            modalHide();
            $('.message').removeClass('show');
            return false;
        });
        $('.modal').off('click').on('click', function(e) {
            e.stopPropagation();
        });
    }
    function modalHide() {
        var modalBackdrop = $('.modal-backdrop');
        // Remove show class
        modalBackdrop.removeClass('show');
        // Brief time out for transition
        clearTimeout(modalTimer);
        modalTimer = setTimeout(function () {
            // Display hide
            modalBackdrop.hide();
        }, 200);
    }
    function modalShow() {
        var modalBackdrop = $('.modal-backdrop');
        // Display block
        modalBackdrop.show();
        // Brief time out for transition
        clearTimeout(modalTimer);
        modalTimer = setTimeout(function () {
            // Add show class
            modalBackdrop.addClass('show');
            // Events
            modalEvents();
        }, 200);
    }
    // ---------------------------------------------------
    // Player Settings
    // ---------------------------------------------------
    function playerSettingsUpdate() {
        var playerSettingsUi = '';
        var playersArray = localData.playersArray;
        for (var i = 0; i < playersArray.length; i++) {
            playerSettingsUi += tmpl('playersRow', {
                'deleteLink': i18n.app.playersRow.deleteLink,
                'key': playersArray[i].key,
                'playerName': playersArray[i].name,
                'playerStatus': (playersArray[i].status) ? 'Active' : 'Inactive'
            });
        }
        $('.players-list').html(playerSettingsUi);
        playerSettingsEvents();
    }
    function playerSettingsEvents() {
        // Delete Event
        $('.player .player-delete').on('click', function() {
            var key = $(this).closest('.player').data('id');
            if (confirm('Delete ' + localData.playersByKey[key].name + '?')) {
                fbdb.ref('/players/' + key).remove().then(function() {
                    messageShow('success', i18n.app.messages.playerDeleted, true);
                    playerSettingsUpdate();
                })
                .catch(function(error) {
                    console.log('Failed to delete player');
                });
            }
            return false;
        });
        // Update Event
        $('.player input').keyup(function (event) {
            var key = $(this).closest('.player').data('id');
            if (event.keyCode === 13) {
                fbdb.ref('/players/' + key).update({
                    "name": $(this).val()
                }, function() {
                    messageShow('success', i18n.app.messages.playerUpdated, true);
                    playerSettingsUpdate();
                }).catch(function(error) {
                    console.log('Failed to update player');
                });
            }
            return false;
        });
        // Update Status
        $('.player .player-status').on('click', function() {
            var currentStatus = $(this).text();
            var key = $(this).closest('.player').data('id');
            var newStatus = true;
            if ('Active' === currentStatus) {
                newStatus = false;
            }
            fbdb.ref('/players/' + key).update({
                status: newStatus
            }, function() {
                messageShow('success', i18n.app.messages.playerStatusUpdated, true);
                playerSettingsUpdate();
            }).catch(function(error) {
                console.log('Failed to update player status');
            });
            return false;
        });
        $('.players-add-link').on('click', function() {
            $('.players-add').slideDown();
            $('.players-add-form textarea').focus()
            $(this).hide();
            setTimeout(function() {
                sidebarResetHeight();
            }, 600);
            return false;
        });
    }
    // ---------------------------------------------------
    // Rankings
    // ---------------------------------------------------
    function rankingsUpdate() {
        var gamesArray = localData.playersByDoubles;
        var doublesRankings = '';
        for (var i = 0; i < gamesArray.length; i++) {
            if (gamesArray[i].status) {
                var scoreLastMovement = (gamesArray[i].doubles_last_movement) ? gamesArray[i].doubles_last_movement.toFixed(2) : '';
                var points = (gamesArray[i].doubles_points) ? gamesArray[i].doubles_points.toFixed(2) : '';
                var pointsBasedBadge = getPointsBadge(points);

                doublesRankings += tmpl('rankingsRow', {
                    'key': gamesArray[i].key,
                    'lastMovement': rankingMovementStyles(scoreLastMovement),
                    'name': gamesArray[i].name,
                    'points': points,
                    'gamesWon' : gamesArray[i].doubles_won,
                    'gamesWonRelative' : (gamesArray[i].doubles_won / localData.mostGamesWonOrLostByOnePlayer) * 100,
                    'gamesLost' :  gamesArray[i].doubles_lost,
                    'gamesLostRelative' :  (gamesArray[i].doubles_lost / localData.mostGamesWonOrLostByOnePlayer ) * 100,
                    'gamesCount' : gamesArray[i].gamesCount,
                    'goalsInfo' : gamesArray[i].doubles_goals_for_avg.toFixed(2)  + ":" + gamesArray[i].doubles_goals_against_avg.toFixed(2),
                    'rank': gamesArray[i].doubles_rank,
                    'type': 'doubles',
                    'pointsBadge' : pointsBasedBadge,
                    'medal' : medalSelector(i),
                    'top' :  (i < 3)? "top":"standard",
                    'rankingStatus' : gamesArray[i].isRanked ? "" : "unranked",
                    'mostGames' : (gamesArray[i].gamesCount == localData.mostGamesByOnePlayer)? "granted" : "",
                    'mostGoals' : (gamesArray[i].doubles_goals_for_avg == localData.bestGoalsForAverage) ? "granted" : "",
                    'holeInTheGoal': (gamesArray[i].doubles_goals_against_avg  == localData.worstGoalsAgainstAverage) ? "granted" : ""
                });
            }
        }
        
        $('.doubles .rankings').html(doublesRankings);
    }

    function getPointsBadge(points)
    {
        if (points >= 150)   return "plat";
        if (points >= 120)   return "gold"      + Math.floor((points - 120)/5);
        if (points >= 80)    return "silver"    + Math.floor((points - 80)/7);
        if (points >= 50)    return "bronze"    + Math.floor((points - 50)/5);
        return "crap";
    }

    function medalSelector(index)
    {
        switch(index){
            case 0: 
                return "gold";
            case 1: 
                return "silver";
            case 2: 
                return "bronze";
        }

        return "";
    }
    function rankingsEvents() {
        // Show stats
        $('.ranking').on('click', function() {
            // Hide sidebar if it's showing
            $('body').removeClass('show-sidebar');
            // Player key
            var thisKey = $(this).data('id');
            // Show stats modal
            modalShow();
            $('.modal').html(tmpl('stats', {
                "forText" : i18n.app.stats.forText,
                "name" : localData.playersByKey[thisKey].name,
                "playerStats" : i18n.app.stats.playerStats
            }));
            // Player stats
            $('.stats-player').html(tmpl('statsPlayer', {
                "doubles" : i18n.app.statsPlayer.doubles,
                "doubles_lost" : localData.playersByKey[thisKey].doubles_lost,
                "doubles_played" : localData.playersByKey[thisKey].doubles_lost + localData.playersByKey[thisKey].doubles_won,
                "doubles_rank" : localData.playersByKey[thisKey].doubles_rank,
                "doubles_won" : localData.playersByKey[thisKey].doubles_won,
                "doubles_goals_for": localData.playersByKey[thisKey].doubles_goals_for || 0,
                "doubles_goals_against": localData.playersByKey[thisKey].doubles_goals_against || 0,
                "gamesLost" : i18n.app.statsPlayer.gamesLost ,
                "gamesPlayed" : i18n.app.statsPlayer.gamesPlayed,
                "goalsFor" : i18n.app.statsPlayer.goalsFor,
                "goalsAgainst" : i18n.app.statsPlayer.goalsAgainst,
                "gamesWon" : i18n.app.statsPlayer.gamesWon,
                "ranking" : i18n.app.statsPlayer.ranking
            }));
            // Player games stats
            var lastTwentyGames = '';
            var lastTwentyGamesData = [];
            var graphScoreData = [];
            graphScoreData[0] = ['Last games', 'Score', 'Default', 'Crap'];

            var playersGames = {};
            fbdb.ref('/playersgame/' + thisKey).limitToLast(20).once('value').then(function(snapshot) {
                playersGames = snapshot.val();
                // To array
                for (var key in playersGames) {
                    lastTwentyGamesData.unshift({
                        "dt" : playersGames[key].dt,
                        "key" : key,
                        "t1p1" : playersGames[key].t1p1,
                        "t1p2" : playersGames[key].t1p2 || '',
                        "t2p1" : playersGames[key].t2p1,
                        "t2p2" : playersGames[key].t2p2 || '',
                        "rating_after_game" : playersGames[key].rating_after_game || '',
                        "t1_points" : playersGames[key].t1_points,
                        "t2_points" : playersGames[key].t2_points,
                        "won" : playersGames[key].won
                    });
                }
                // Iterate through array
                for (var i = 0; i < lastTwentyGamesData.length; i++) {
                    // Date 
                    var date = getDateInNiceStringFormat(lastTwentyGamesData[i].dt);
                    
                    // Game status
                    var gameStatus = 'Lost';
                    if (lastTwentyGamesData[i].won) {
                        gameStatus = 'Won';
                    }
                    if (!localData.playersByKey[lastTwentyGamesData[i].t1p1] || !localData.playersByKey[lastTwentyGamesData[i].t2p1]) {
                        continue;
                    }
                    // Players
                    var t1 = localData.playersByKey[lastTwentyGamesData[i].t1p1].name || '';
                    var t2 = localData.playersByKey[lastTwentyGamesData[i].t2p1].name || '';
                    if (lastTwentyGamesData[i].t1p2) {
                        if (!localData.playersByKey[lastTwentyGamesData[i].t1p2]) {
                            continue;
                        }
                        var t1p2 = localData.playersByKey[lastTwentyGamesData[i].t1p2].name || '';
                        t1 += '/' + t1p2;
                    }
                    if (lastTwentyGamesData[i].t2p2) {
                        if (!localData.playersByKey[lastTwentyGamesData[i].t2p2]) {
                            continue;
                        }
                        var t2p2 = localData.playersByKey[lastTwentyGamesData[i].t2p2].name || '';
                        t2 += '/' + t2p2;
                    }
                    // Piece it all together
                    lastTwentyGames += tmpl('statsPlayerGames', {
                        "date" : date,
                        "status" : gameStatus,
                        "rating_after_game" : (lastTwentyGamesData[i].rating_after_game) ? lastTwentyGamesData[i].rating_after_game.toFixed(2) :'',
                        "t1" : t1,
                        "t1Score" : lastTwentyGamesData[i].t1_points,
                        "t2" : t2,
                        "t2Score" : lastTwentyGamesData[i].t2_points
                    });

                    //Since we already iterate through last games, store some of that data for the graph rendering purpose
                    if (lastTwentyGamesData[i].rating_after_game > 0)
                        graphScoreData[i+1] = [-i,100, 50, lastTwentyGamesData[i].rating_after_game];
                }
                if (!lastTwentyGames) {
                    lastTwentyGames = '<li>No games have been entered for this user.</li>';
                }
                else
                {
                    drawChart(graphScoreData);
                }
                // Add it to the DOM
                $('.stats-player-games ul').html(lastTwentyGames);
            }).catch(function(error) {
                console.log('Unable to pull player game history');
                console.log(error)
            });
        });
    }
    function drawChart(statsData) {
        if (!statsData)
            return;

        var data = google.visualization.arrayToDataTable(statsData);

        var options = {
          title: 'Player score over time',
          titleColor: '#eee',
          hAxis: {
              title: 'Last games',  
              textStyle: {color: '#ccc'},
              titleTextStyle: {color: '#ccc'},
              gridlines: {color: '#222', count: -1}
            },
          vAxis: {
              minValue: 0,
              textStyle: {color: '#ccc'},
              gridlines: {color: '#222', count: -1}
            },
          chartArea: {'width':'80%'},
          legend: {'position':'none'},
          series: {
            0: { areaOpacity: 0, color: "#111", tooltip: false },
            1: { areaOpacity: 0, color: "#A00", tooltip: false},
            2: { areaOpacity: 0.3, color: 'orange', tooltip: true}
          },
          backgroundColor: '#404040'
        };

        var chart = new google.visualization.AreaChart(document.getElementById('stats-graph'));
        chart.draw(data, options);
      }

    function renderHistoricalGames() {
        fbdb.ref('/history/').limitToLast(10).once('value').then(function(snapshot) {
            // Games stats
            var lastTwentyGames = '';
            var lastTwentyGamesData = [];
            var history = {};
            
            history = snapshot.val();
            // To array
            for (var key in history) {
                lastTwentyGamesData.unshift({
                    "dt" : history[key].dt,
                    "t1p1" : history[key].t1p1,
                    "t1p2" : history[key].t1p2 || '',
                    "t2p1" : history[key].t2p1,
                    "t2p2" : history[key].t2p2 || '',
                    "t1_points" : history[key].t1_points,
                    "t2_points" : history[key].t2_points,
                    "t1p1_pointsMovement": (history[key].t1p1_pointsMovement) ? history[key].t1p1_pointsMovement.toFixed(2) : '',
                    "t2p1_pointsMovement": (history[key].t2p1_pointsMovement) ? history[key].t2p1_pointsMovement.toFixed(2) : ''
                });
            }
            // Iterate through array
            for (var i = 0; i < lastTwentyGamesData.length; i++) {
                // Date 
                var date = getDateInNiceStringFormat(lastTwentyGamesData[i].dt);
                
                // Players
                var t1 = localData.playersByKey[lastTwentyGamesData[i].t1p1].name; 
                t1 += lastTwentyGamesData[i].t1p2 !== '' ? '/' + localData.playersByKey[lastTwentyGamesData[i].t1p2].name : '';

                var t2 = localData.playersByKey[lastTwentyGamesData[i].t2p1].name;
                t2 +=  lastTwentyGamesData[i].t2p2 !== '' ? '/' + localData.playersByKey[lastTwentyGamesData[i].t2p2].name : '';
                
                // Piece it all together
                lastTwentyGames += tmpl('historicalGame', {
                    "date" : date,
                    "t1" : t1,
                    "t1Score" : lastTwentyGamesData[i].t1_points,
                    "t1Class": teamClassBasedOnScore(lastTwentyGamesData[i].t1_points, lastTwentyGamesData[i].t2_points),
                    "t1PointMovement": lastTwentyGamesData[i].t1p1_pointsMovement,
                    "t2" : t2,
                    "t2Score" : lastTwentyGamesData[i].t2_points,
                    "t2Class": teamClassBasedOnScore(lastTwentyGamesData[i].t2_points, lastTwentyGamesData[i].t1_points),
                    "t2PointMovement": lastTwentyGamesData[i].t2p1_pointsMovement,
                });
            }
            // Add it to the DOM
            $('.history').html(lastTwentyGames);
        }).catch(function(error) {
            console.log('Unable to pull player game history');
            console.log(error)
        });        
    }
    function initGooglePlotPackage()
    {
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(drawChart);
    }

    function getDateInNiceStringFormat(timestamp)
    {
        var d = new Date(timestamp);
        var curr_date = ("0" + d.getDate()).slice(-2);
        var curr_month = ("0" + (d.getMonth()+ 1 )).slice(-2); //Months are zero based
        var curr_year = d.getFullYear();
        return curr_year + "-" + curr_month + "-" + curr_date;
    }
    function rankingMovementStyles(movement)
    {
        if (movement > 0) {
            movement = '<span class="movement-positive">+ ' + movement + '</span>';
        }
        return movement;
    }
    function teamClassBasedOnScore(ownTeamPoints,opponentTeamPoints)
    {
        var teamClass = 'Won';
        if(opponentTeamPoints > ownTeamPoints){
            teamClass = 'Lost';
        }
        return teamClass;
    }

    
    
    // ---------------------------------------------------
    // Scoring
    // ---------------------------------------------------
    function scoringAdd() {
        // Scores
        var t1s = $('.t1-score').val();
        var t2s = $('.t2-score').val();
        if (logging) {
            console.log('scores');
            console.log(t1s);
            console.log(t2s);
            console.log('----');
        }
        // Players keys
        var t1p1Key = $('.t1-players a.selected').first().data('id');
        var t1p2Key = $('.t1-players a.selected').last().data('id'); //if you select one player only, t1p2Key = t1p1Key
        var t2p1Key = $('.t2-players a.selected').first().data('id');
        var t2p2Key = $('.t2-players a.selected').last().data('id'); //if you select one player only, t2p2Key = t2p1Key
        if (logging) {
            console.log('keys');
            console.log(t1p1Key);
            console.log(t1p2Key);
            console.log(t2p1Key);
            console.log(t2p2Key);
            console.log('----');
        }
        
        // Team ranking points
        var t1rp = [localData.playersByKey[t1p1Key].doubles_points + localData.playersByKey[t1p2Key].doubles_points] / 2;
        var t2rp = [localData.playersByKey[t2p1Key].doubles_points + localData.playersByKey[t2p2Key].doubles_points] / 2;
        
        if (logging) {
            console.log('Team ranking points');
            console.log(t1rp);
            console.log(t2rp);
            console.log('----');
        }
        // Game ranking points
        var grp = [t1rp + t2rp] / 2;
        if (logging) {
            console.log('Game ranking points');
            console.log(grp);
            console.log('----');
        }
        // Team points
        var t1p = grp + [t1s - t2s] * 100 / Math.max(t1s, t2s);
        var t2p = grp + [t2s - t1s] * 100 / Math.max(t1s, t2s);
        if (logging) {
            console.log('Team points');
            console.log(t1p);
            console.log(t2p);
            console.log('----');
        }
        
        var t1p1rp = t1p + [localData.playersByKey[t1p1Key].doubles_points - localData.playersByKey[t1p2Key].doubles_points] / 2;
        var t1p2rp = 2 * t1p - t1p1rp; //if you select one player only, t1p2rp = t1p1rp
        var t2p1rp = t2p + [localData.playersByKey[t2p1Key].doubles_points - localData.playersByKey[t2p2Key].doubles_points] / 2;
        var t2p2rp = 2 * t2p - t2p1rp; //if you select one player only, t2p2rp = t2p1rp

        var gameData = {
            "dt": Date.now(),
            "t1p1_points": t1p1rp,
            "t1p2_points": t1p2rp,
            "t2p1_points": t2p1rp,
            "t2p2_points": t2p2rp
        }
        if (logging) {
            console.log('Doubles Player ranking points');
            console.log(t1p1rp);
            console.log(t1p2rp);
            console.log(t2p1rp);
            console.log(t2p2rp);
            console.log(gameData);
            console.log('----');
        }
        
        // Save "games" data
        var newGameKey = fbdb.ref().child('games').push().key;
        var dbGames = fbdb.ref('/games/' + newGameKey);
        dbGames.set(gameData).catch(function(error) {
            console.log('Failed to add new game');
        });
        if (logging) {
            console.log('Save "games" data');
            console.log(newGameKey);
            console.log('----');
        }
        // Reset last movements
        scoringResetLastMovements('doubles_last_movement', {'doubles_last_movement' : ''});
        
        if (logging) {
            console.log('Reset last movements');
            console.log('----');
        }
        // Decay factor
        var decay_factor = 10;
        // New player ranking points
        
        // New doubles player points
        var t1p1PointsNew = localData.playersByKey[t1p1Key].doubles_points / decay_factor * [decay_factor - 1] + t1p1rp / decay_factor;
        var t1p2PointsNew = localData.playersByKey[t1p2Key].doubles_points / decay_factor * [decay_factor - 1] + t1p2rp / decay_factor;
        var t2p1PointsNew = localData.playersByKey[t2p1Key].doubles_points / decay_factor * [decay_factor - 1] + t2p1rp / decay_factor;
        var t2p2PointsNew = localData.playersByKey[t2p2Key].doubles_points / decay_factor * [decay_factor - 1] + t2p2rp / decay_factor;
        // Update last movements
        var t1p1LastMovement = t1p1PointsNew - localData.playersByKey[t1p1Key].doubles_points;
        var t1p2LastMovement = t1p2PointsNew - localData.playersByKey[t1p2Key].doubles_points;
        var t2p1LastMovement = t2p1PointsNew - localData.playersByKey[t2p1Key].doubles_points;
        var t2p2LastMovement = t2p2PointsNew - localData.playersByKey[t2p2Key].doubles_points;
        // Updates games won/lost
        var t1p1GamesLost = localData.playersByKey[t1p1Key].doubles_lost;
        var t1p1GamesWon = localData.playersByKey[t1p1Key].doubles_won;        
        var t1p2GamesLost = localData.playersByKey[t1p2Key].doubles_lost;
        var t1p2GamesWon = localData.playersByKey[t1p2Key].doubles_won;        
        var t2p1GamesLost = localData.playersByKey[t2p1Key].doubles_lost;
        var t2p1GamesWon = localData.playersByKey[t2p1Key].doubles_won;        
        var t2p2GamesLost = localData.playersByKey[t2p2Key].doubles_lost;
        var t2p2GamesWon = localData.playersByKey[t2p2Key].doubles_won;
        // Update GoalsFor/Against
        var t1p1GoalsForNew = (localData.playersByKey[t1p1Key].doubles_goals_for || 0) + parseInt(t1s);
        var t1p2GoalsForNew = (localData.playersByKey[t1p2Key].doubles_goals_for || 0) + parseInt(t1s);
        var t2p1GoalsForNew = (localData.playersByKey[t2p1Key].doubles_goals_for || 0) + parseInt(t2s);
        var t2p2GoalsForNew = (localData.playersByKey[t2p2Key].doubles_goals_for || 0) + parseInt(t2s);
        var t1p1GoalsAgainstNew = (localData.playersByKey[t1p1Key].doubles_goals_against || 0) + parseInt(t2s);        
        var t1p2GoalsAgainstNew = (localData.playersByKey[t1p2Key].doubles_goals_against || 0) + parseInt(t2s);
        var t2p1GoalsAgainstNew = (localData.playersByKey[t2p1Key].doubles_goals_against || 0) + parseInt(t1s);
        var t2p2GoalsAgainstNew = (localData.playersByKey[t2p2Key].doubles_goals_against || 0) + parseInt(t1s);
        
        
        var t1Won = false;
        var t2Won = false;
        if (parseInt(t1s) > parseInt(t2s)) {
            t1Won = true;
            t1p1GamesWon += 1;
            t1p2GamesWon += 1;
            t2p1GamesLost += 1;
            t2p2GamesLost += 1;
        } else {
            t2Won = true;
            t2p1GamesWon += 1;
            t2p2GamesWon += 1;
            t1p1GamesLost += 1;
            t1p2GamesLost += 1;
        }
        // Cache last game
        lastGame.players = {
            'type' : 'doubles',
            'scores' : [
                {
                    'player' : 't1p1',
                    'key' : t1p1Key,
                    'pointsNew' : t1p1PointsNew,
                    'lastMovement' : t1p1LastMovement,
                    'gamesLost' : t1p1GamesLost,
                    'gamesWon' : t1p1GamesWon,
                    'newGameKey' : newGameKey,
                    't1p1Key' : t1p1Key,
                    't1p2Key' : t1p2Key,
                    't2p1Key' : t2p1Key,
                    't2p2Key' : t2p2Key,
                    't1s' : t1s,
                    't2s' : t2s,
                    'won' : t1Won
                },
                {
                    'player' : 't1p2',
                    'key' : t1p2Key,
                    'pointsNew' : t1p2PointsNew,
                    'lastMovement' : t1p2LastMovement,
                    'gamesLost' : t1p2GamesLost,
                    'gamesWon' : t1p2GamesWon,
                    'newGameKey' : newGameKey,
                    't1p1Key' : t1p1Key,
                    't1p2Key' : t1p2Key,
                    't2p1Key' : t2p1Key,
                    't2p2Key' : t2p2Key,
                    't1s' : t1s,
                    't2s' : t2s,
                    'won' : t1Won
                },
                {
                    'player' : 't2p1',
                    'key' : t2p1Key,
                    'pointsNew' : t2p1PointsNew,
                    'lastMovement' : t2p1LastMovement,
                    'gamesLost' : t2p1GamesLost,
                    'gamesWon' : t2p1GamesWon,
                    'newGameKey' : newGameKey,
                    't1p1Key' : t1p1Key,
                    't1p2Key' : t1p2Key,
                    't2p1Key' : t2p1Key,
                    't2p2Key' : t2p2Key,
                    't1s' : t1s,
                    't2s' : t2s,
                    'won' : t2Won
                },
                {
                    'player' : 't2p2',
                    'key' : t2p2Key,
                    'pointsNew' : t2p2PointsNew,
                    'lastMovement' : t2p2LastMovement,
                    'gamesLost' : t2p2GamesLost,
                    'gamesWon' : t2p2GamesWon,
                    'newGameKey' : newGameKey,
                    't1p1Key' : t1p1Key,
                    't1p2Key' : t1p2Key,
                    't2p1Key' : t2p1Key,
                    't2p2Key' : t2p2Key,
                    't1s' : t1s,
                    't2s' : t2s,
                    'won' : t2Won
                }
            ]
        }
        if (logging) {
            console.log('Doubles save score');
            console.log(['t1p1', 'doubles', t1p1Key, t1p1PointsNew, t1p1LastMovement, t1p1GamesLost, t1p1GamesWon, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t1Won]);
            console.log(['t1p2', 'doubles', t1p2Key, t1p2PointsNew, t1p2LastMovement, t1p2GamesLost, t1p2GamesWon, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t1Won]);
            console.log(['t2p1', 'doubles', t2p1Key, t2p1PointsNew, t2p1LastMovement, t2p1GamesLost, t2p1GamesWon, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t2Won]);
            console.log(['t2p2', 'doubles', t2p2Key, t2p2PointsNew, t2p2LastMovement, t2p2GamesLost, t2p2GamesWon, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t2Won]);
            console.log('----');
        }
        // Save score for Team #1
        if (t1p1Key === t1p2Key){
            t1p2Key = t2p2Key = '';

            scoringSave('t1p1', 'doubles', t1p1Key, t1p1PointsNew, t1p1LastMovement, t1p1GamesLost, t1p1GamesWon, t1p1GoalsForNew, t1p1GoalsAgainstNew, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t1Won);
            scoringSave('t2p1', 'doubles', t2p1Key, t2p1PointsNew, t2p1LastMovement, t2p1GamesLost, t2p1GamesWon, t2p1GoalsForNew, t2p1GoalsAgainstNew, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t2Won);
        }
        else {
            scoringSave('t1p1', 'doubles', t1p1Key, t1p1PointsNew, t1p1LastMovement, t1p1GamesLost, t1p1GamesWon, t1p1GoalsForNew, t1p1GoalsAgainstNew, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t1Won);
            scoringSave('t1p2', 'doubles', t1p2Key, t1p2PointsNew, t1p2LastMovement, t1p2GamesLost, t1p2GamesWon, t1p2GoalsForNew, t1p2GoalsAgainstNew, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t1Won);        
            scoringSave('t2p1', 'doubles', t2p1Key, t2p1PointsNew, t2p1LastMovement, t2p1GamesLost, t2p1GamesWon, t2p1GoalsForNew, t2p1GoalsAgainstNew, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t2Won);
            scoringSave('t2p2', 'doubles', t2p2Key, t2p2PointsNew, t2p2LastMovement, t2p2GamesLost, t2p2GamesWon, t2p2GoalsForNew, t2p2GoalsAgainstNew, newGameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t2Won);
        }

        historyAddGame(t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t1p1LastMovement, t1p2LastMovement, t2p1LastMovement, t2p2LastMovement);
        
        // Confirmation --------------------
        // Close modal
        modalHide();
        // Add success message
        messageShow('success', i18n.app.messages.gameAdded + '! <a href="#" class="undo">' + i18n.app.messages.undo + '</a>', false);
        initUndo();
        sendScoreToRelativitySlackFoosball(t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s);
    }

    function sendScoreToRelativitySlackFoosball(t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s)
    {
        var t1Label = localData.playersByKey[t1p1Key].name + '/' + localData.playersByKey[t1p2Key].name;
        var t2Label = localData.playersByKey[t2p1Key].name + '/' + localData.playersByKey[t2p2Key].name;

        if(t1Label.includes('Test') || t2Label.includes('Test'))
        {
            return;
        }

        var relativitySlackHookTemporaryUrl='https://hooks.slack.com/services/' + slackToken;
        
        if (t1s > t2s){
            var slackPayload = ':dragonball::trophy:' + t1Label +' '+ t1s +' : '+ t2s +' '+ t2Label + ':dragonball:';
        }else{
            var slackPayload = ':dragonball:' + t1Label +' '+ t1s +' : '+ t2s +' :trophy:'+ t2Label + ':dragonball:';
        }
        
        $.ajax(
        {
            type: 'POST',
            url: relativitySlackHookTemporaryUrl,
            data: '{ "text":"'+slackPayload+'"}',
            dataType : 'json'
        });
    }
    function scoringEvents() {
        $('.score-add').off('submit').on('submit', function() {
            if (scoringValidation()) {
                scoringAdd();
            }
            return false;
        });
        // De-activate selected user on other team to avoid selecting the same player on both teams
        $('.t1-players a').on('click', function() {
            var thisKey = $(this).data('id');
            var isChecked = $(this).hasClass('selected');
            $('.t2-players a[data-id="' + thisKey + '"]').toggleClass('is-disabled', isChecked);
        });
        $('.t2-players a').on('click', function() {
            var thisKey = $(this).data('id');
            var isChecked = $(this).hasClass('selected');
            $('.t1-players a[data-id="' + thisKey + '"]').toggleClass('is-disabled', isChecked);
        });
        //Increment
        $('.increment a').off('click').on('click', function() {
            var $this = $(this);
            var amount = $this.data('amount');
            var team = $this.data('team');
            var teamScore = $('.t' + team + '-score');
            var teamScoreValueNew = parseInt(amount);
            
            teamScore.val(teamScoreValueNew);
            return false;
        });
    }
    function scoringPopulatePlayerSelection() {
        var playersArray = localData.playersArray;
        var playerScoresUi = '';
        for (var i = 0; i < playersArray.length; i++) {
            if (playersArray[i].status) {
                playerScoresUi += tmpl('scorePlayers', {
                    'key': playersArray[i].key,
                    'playerName': playersArray[i].name,
                    'unranked': !playersArray[i].isRanked? "unranked":""
                });
            }
        }
        $('.t1-players, .t2-players').html(playerScoresUi);
        clearTimeout(scoringEventsTimer);
        scoringEventsTimer = setTimeout(function() {
            scoringEvents();
        }, 300);
    }
    function scoringResetLastMovements(type, obj) {
        var playersArray = localData.playersArray;
        for (var i = 0; i < playersArray.length; i++) {
            var key = playersArray[i].key;
            if (playersArray[i][type]) {
                fbdb.ref('/players/' + key).update(obj).catch(function(error) {
                    console.log('Failed to reset last movement');
                });
            }
        }
    }
    function scoringSave(player, type, key, points, movement, lost, won, goals_for, goals_against, gameKey, t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, wonGame) {
        // Save "players" data
        var playersData = {}
            playersData[type + '_points'] = points;
            playersData[type + '_last_movement'] = movement;
            playersData[type + '_lost'] = lost;
            playersData[type + '_won'] = won;
            playersData[type + '_goals_for'] = goals_for;
            playersData[type + '_goals_against'] = goals_against;
        if (logging) {
            console.log('Save "players" data');
            console.log(playersData);
            console.log('----');
        }
        fbdb.ref('/players/' + key).update(playersData).catch(function(error) {
            console.log('Failed to update players data');
        });
        // Save "players_game" data
        var playersGameData = {
            "dt": Date.now(),
            "game": gameKey,
            "player": key,
            "rating_after_game": points,
            "t1p1": t1p1Key,
            "t2p1": t2p1Key,
            "t1_points": t1s,
            "t2_points": t2s,
            "won": wonGame
        };
        if ('' !== t1p2Key && '' !== t2p2Key) {
            playersGameData.t1p2 = t1p2Key;
            playersGameData.t2p2 = t2p2Key;
        }
        if (logging) {
            console.log('Save "players_game" data');
            console.log(playersGameData);
            console.log('----');
        }
        var newPlayersGameKey = fbdb.ref().child('playersgame' + key).push().key;
        lastGame.game[player] = newPlayersGameKey;
        if (logging) {
            console.log('last game cache');
            console.log(lastGame);
            console.log('----');
        }
        var dbPlayersGame = fbdb.ref('/playersgame/' + key + '/' + newPlayersGameKey);
        dbPlayersGame.set(playersGameData).catch(function(error) {
            console.log('Failed to add new players game');
        });
    }

    function historyAddGame(t1p1Key, t1p2Key, t2p1Key, t2p2Key, t1s, t2s, t1p1LastMovement, t1p2LastMovement, t2p1LastMovement, t2p2LastMovement) {
        
        // Save games for history view.
        var newGamesHistoryData = { 
            "dt": Date.now(),
            "t1p1": t1p1Key,
            "t2p1": t2p1Key,
            "t1_points": t1s,
            "t2_points": t2s,
            "t1p1_pointsMovement": t1p1LastMovement, 
            "t1p2_pointsMovement": t1p2LastMovement, 
            "t2p1_pointsMovement": t2p1LastMovement, 
            "t2p2_pointsMovement": t2p2LastMovement
        };

        if ('' !== t1p2Key && '' !== t2p2Key) {
            newGamesHistoryData.t1p2 = t1p2Key;
            newGamesHistoryData.t2p2 = t2p2Key;
        }

        var newGamesHistoryKey = fbdb.ref().child('history').push().key;
        
        var dbGamesHistory = fbdb.ref('/history/' + newGamesHistoryKey);
        dbGamesHistory.set(newGamesHistoryData).catch(function(error) {
            console.log('Failed to add game to the history');
        });
    }

    function scoringUndo(player, type, key, points, movement, lost, won) {
        // Update player stats
        var playersData = {}
            playersData[type + '_points'] = points;
            playersData[type + '_last_movement'] = movement;
            playersData[type + '_lost'] = lost;
            playersData[type + '_won'] = won;
        fbdb.ref('/players/' + key).update(playersData).catch(function(error) {
            console.log('Failed to update players data');
        });
        // Remove Players Games
        fbdb.ref('/playersgame/' + key + '/' + lastGame.game[player]).remove().catch(function(error) {
            console.log('Failed to undo players game');
        });
    }
    function scoringValidation() {
        var t1Count = $('.t1 a.selected').length;
        var t2Count = $('.t2 a.selected').length;

        // Valid integer for both scores
        if ($('.t1-score').val() === '' || $('.t2-score').val() === '') {
            messageShow('error', i18n.app.messages.scoreBoth, true);
            return false;
        }

        // At least 1 name is checked per team
        if (!$('.t1-players a').hasClass('selected')) {
            messageShow('error', i18n.app.messages.onePlayer, true);
            return false;
        }
        if (!$('.t2-players a').hasClass('selected')) {
            messageShow('error', i18n.app.messages.onePlayer, true);
            return false;
        }

        // No more than 2 names checked per team
        if (t1Count > 2) {
            messageShow('error', i18n.app.messages.maxTwo, true);
            return false;
        }
        if (t2Count > 2) {
            messageShow('error', i18n.app.messages.maxTwo, true);
            return false;
        }

        // Same player(s) are not selected on both teams
        $('.t1 a.selected').each(function( index ) {
                if ($('.t2 a[data-id="' + $(this).data('id') + '"]').hasClass('selected')) {
                messageShow('error', i18n.app.messages.bothTeams, true);
                return false;
            }
        });

        // Same number of players are selected on both teams
        if (t1Count !== t2Count) {
            messageShow('error', i18n.app.messages.bothTeamsNumber, true);
            return false;
        }

        // No ties
        if ($('.t1-score').val() === $('.t2-score').val()) {
            messageShow('error', i18n.app.messages.keepPlaying + '! ' + i18n.app.messages.noTies + '.', true);
            return false;
        }

        return true;
    }
    // ---------------------------------------------------
    // Sidebar
    // ---------------------------------------------------
    function sidebarBasicSettingsUpdate() {
        $('#orgName').val(localData.settings.orgName).focus();
        $('.org').text(localData.settings.orgName);
        // Update game type
        var gameType = '';
        if ('air-hockey' === localData.settings.gameType) {
            gameType = 'Air Hockey';
        } else if ('billiards' === localData.settings.gameType) {
            gameType = 'Billiards';
        } else if ('foosball' === localData.settings.gameType) {
            gameType = 'Foosball';
        } else if ('shuffleboard' === localData.settings.gameType) {
            gameType = 'Shuffleboard';
        } else {
            gameType = 'Table Tennis';
        }
        $('.game-type').text(gameType);
        $('input[value="' + localData.settings.gameType + '"]').prop('checked', true);
        var lang = localStorage.getItem('lang') || 'en';
        $('.lang option[value="' + lang + '"]').attr("selected", true);
    }
    function sidebarHideIris() {
        $('.iris-picker').hide();
    }
    function sidebarInit() {
        $('.sidebar header').html(tmpl('sidebarHeader', {
            "settings" : i18n.app.sidebarHeader.settings
        }));
        $('.sidebar .sidebar-menu').html(tmpl('sidebarMenu', {
            "basics" : i18n.app.sidebarMenu.basics,
            "players" : i18n.app.sidebarMenu.players
        }));
        sidebarInitEvents();
        // resize event
        $( window ).resize(function() {
            sidebarResetHeight();
        });
    }
    function sidebarInitEvents() {
        $('.sidebar-basics').off('click').on('click', function() {
            sidebarInitBasic();
            sidebarResetHeight();
            return false;
        });
        $('.sidebar-players').off('click').on('click', function() {
            sidebarInitPlayer();
            sidebarResetHeight();
            return false;
        });        
        // Sidebar close
        $('.sidebar .sidebar-close').off('click').on('click', function() {
            $('body').removeClass('show-sidebar');
            return false;
        });
    }
    function sidebarInitBasic() {
        $('.sidebar-body').html(tmpl('settingsBasics', {
            "companyOrClub" : i18n.app.settingsBasics.companyOrClub,
            "gameAirHockey" : i18n.app.settingsBasics.gameAirHockey,
            "gameBilliards" : i18n.app.settingsBasics.gameBilliards,
            "gameFoosball" : i18n.app.settingsBasics.gameFoosball,
            "gameShuffleboard" : i18n.app.settingsBasics.gameShuffleboard,
            "gameTableTennis" : i18n.app.settingsBasics.gameTableTennis,
            "language" : i18n.app.settingsBasics.language,
            "orgName" : i18n.app.settingsBasics.orgName,
            "whatGame" : i18n.app.settingsBasics.whatGame
        }));
        sidebarInitBasicEvents();
        sidebarBasicSettingsUpdate();
        // Update menu bar
        $('.sidebar-menu .c-button').removeClass('active');
        $('.sidebar-basics').addClass('active');
    }
    function sidebarInitBasicEvents() {
        // Update company name
        $('#orgName').off('blur').on('blur', function() {
            var name = $(this).val();
            if (name !== localData.settings.orgName && name !== '') {
                fbdb.ref('/settings/').update({
                    'orgName': $(this).val()
                }, function() {
                    messageShow('success', i18n.app.messages.nameUpdated, true);
                }).catch(function(error) {
                    console.log('Failed to update name');
                });
            }
            return false;
        });
        // Update game type
        $('input[name="gameType"]').off('change').on('change', function() {
            fbdb.ref('/settings/').update({
                'gameType': $(this).val()
            }, function() {
                messageShow('success', i18n.app.messages.gameTypeUpdated, true);
            }).catch(function(error) {
                console.log('Failed to update game type');
            });
            return false;
        });
        // Select language
        $('.lang').on('change', function() {
            localStorage.setItem('lang', $(this).val());
            location.reload();
        });
    }
    function sidebarInitPlayer() {
        $('.sidebar-body').html(tmpl('settingsPlayers', {
            "addPlayers" : i18n.app.settingsPlayers.addPlayers,
            "onePerLine" : i18n.app.settingsPlayers.onePerLine
        }));
        // Update player settings
        playerSettingsUpdate();
        sidebarInitPlayerEvents();
        // Update menu bar
        $('.sidebar-menu .c-button').removeClass('active');
        $('.sidebar-players').addClass('active');
    }
    function sidebarInitPlayerEvents() {
        // Add Players
        $('.players-add form').off('click').on('submit', function() {
            var playersField = $('.players-add form textarea');
            $.each( playersField.val().split('\n'), function( index, player ){
                if (!player) {
                    return false;
                }
                // Grab a new players key
                var newPlayerKey = fbdb.ref().child('players').push().key;
                // Add new player
                var dbPlayers = fbdb.ref('/players/' + newPlayerKey);
                dbPlayers.set({ 
                    "doubles_last_movement": '',
                    "doubles_lost": 0,
                    "doubles_points": 100,
                    "doubles_won": 0,
                    "dt": Date.now(),
                    "name": player,
                    "status": true 
                }).then(function() {
                    playerSettingsUpdate();
                    messageShow('success', i18n.app.messages.playerAdded, true);
                }).catch(function(error) {
                    console.log('Failed to add player');
                });
            });
            // Reset textarea
            playersField.val('').focus();
            // Reset sidebar height
            sidebarResetHeight();
            return false;
        });        
    }
        
    function sidebarResetHeight() {
        $('.sidebar').css('height', '400px');
        var sidebarHeight = parseInt($('.sidebar-container').height());
        var windowHeight = parseInt($(window).height());
        var newSidebarHeight = Math.max(sidebarHeight, windowHeight);
        $('.sidebar').css('height', newSidebarHeight + 'px');
    }  
    function sidebarShow() {
        $('body').addClass('show-sidebar');
        sidebarInitBasic();
        sidebarResetHeight();
    }     
    function sidebarToggle() {
        var body = $('body');
        if (body.hasClass('show-sidebar')) {
            body.removeClass('show-sidebar');
        } else {
            sidebarShow();
        }
    }
    
})(jQuery);