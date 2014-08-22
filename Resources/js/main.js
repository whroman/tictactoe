$(function() {
    var Tile = Backbone.Model.extend({
        defaults: function() {
            var order = Tiles.nextId(),
                timeStamp = new Date().getTime();
            return {
                id: order,
                hasBeenSelected: false,
                selectedBy: "",
                timeStamp: timeStamp
            };
        },

        x : "", 
        y : "",
    });

    var AllTiles = Backbone.Collection.extend({
        model: Tile,
        localStorage: new Backbone.LocalStorage("tictactoe"),
        numOfClicks: 0,
        startPlayer: 0,
        boardSize: null,
        allowClicks: true,
        possibleWins: [],
        nextId: function() {
            if (!this.length) return 1;
            return this.last().get("id") + 1;
        },
        newGame: function(boardSize) {
            for ( var yy = 0; yy < boardSize; yy++ ) {
                for ( var xx = 0; xx < boardSize; xx++ ) {
                    var tile = this.create({
                        x: xx, 
                        y: yy, 
                    });
                    tile.save();
                }
            }
        },
        horizontalWins: function() {
            for (var yy = 0; yy < this.boardSize; yy++) {
                var wins = [];
                for (var xx = 0; xx < this.boardSize; xx++) {
                    wins.push({
                        x: xx,
                        y: yy
                    });
                }
                this.possibleWins.push(wins);
            }

            return this;
        },
        verticalWins: function() {
            for (var xx = 0; xx < this.boardSize; xx++) {
                var wins = [];
                for (var yy = 0; yy < this.boardSize; yy++) {
                    wins.push({
                        x: xx,
                        y: yy
                    });
                }
                this.possibleWins.push(wins);
            }
            return this;
        },
        crossWins: function() {
            var topLeftBottomRight = [],
                bottomLeftTopRight = [];

            for (var size = 0; size < this.boardSize; size++) {
                topLeftBottomRight.push({
                    x: size,
                    y: size
                });
                bottomLeftTopRight.push({
                    x: size,
                    y: this.boardSize - 1 - size
                });
            }
            this.possibleWins.push(topLeftBottomRight);
            this.possibleWins.push(bottomLeftTopRight);
            return this;
        },
        selectedTiles: function(tile) {
            var whereSelected = {
                "selectedBy": tile.get("selectedBy")
            };
            return this.where(whereSelected);
        },
        checkIfWin: function(tile) {
            var playerTiles = Tiles.selectedTiles(tile),
                possibleWins = Tiles.possibleWins,
                playerTileCoords = [],
                i = 0;
            for (i; i < playerTiles.length; i++) {
                playerTileCoords.push({
                    x: playerTiles[i].get("x"),
                    y: playerTiles[i].get("y")                  
                });
            }
            for (i = 0; i < possibleWins.length; i++) {
                var count = 0,
                    numSelectedTiles = Tiles.where({"hasBeenSelected": true}).length;
                for (var j = 0; j < possibleWins[i].length; j++) {
                    for (var k = 0; k < playerTileCoords.length; k++) {
                        if (possibleWins[i][j].x == playerTileCoords[k].x &&
                            possibleWins[i][j].y == playerTileCoords[k].y) {
                            count++;
                        }
                    }
                }
                if (count == Tiles.boardSize) {
                    tile.trigger("win", tile);
                } else if (numSelectedTiles == Tiles.boardSize * Tiles.boardSize) {
                    tile.trigger("tie");
                }
            }
        },
        endOfGame: function() {
            Tiles.allowClicks = false;
        },
        comparator: "id",
    });

    var Tiles = new AllTiles();

    var TileView = Backbone.View.extend({
        template: _.template($('#tile-template').html()),
        events: {
            "click": "tileClick",
        },
        initialize: function() {
            this.listenTo(this.model, "all", this.markTile);
            this.listenTo(this.model, "change:hasBeenSelected", Tiles.checkIfWin);
        },
        render: function() {
            return this.template(this.model.toJSON());
        },
        tileClick: function() {
            if (this.model.get("hasBeenSelected") === false &&  Tiles.allowClicks === true) {
                var player = Tiles.numOfClicks % 2;
                this.model.save({
                    selectedBy: player,
                    hasBeenSelected: true
                });
                Tiles.numOfClicks++;
            }
        },
        markTile: function() {
            var player = Tiles.numOfClicks % 2;
            if (player === 0) {
                this.$el.addClass("one");
                App.playerOne.removeClass("one");
                App.playerTwo.addClass("two");
                App.$el.addClass("two").removeClass("one");
            } else if (player === 1) {
                this.$el.addClass("two");
                App.playerTwo.removeClass("two");
                App.playerOne.addClass("one");
                App.$el.addClass("one").removeClass("two");
            }
        },
    });

    var BoardView = Backbone.View.extend({
        el: $("#board"),
        playerOne : $(".player.one .tile"),
        playerTwo : $(".player.two .tile"),
        initialize: function(options) {

            this.listenTo(Tiles, "win", this.win);
            this.listenTo(Tiles, "tie", this.tie);
            this.listenTo(Tiles, "reset", this.render);
            this.listenTo(Tiles, "playerOneTurn", this.hello);
            this.listenTo(Tiles, "playerTwoTurn", this.hello);

            $("#overlay-bg").on("click", function() {
                $(this).removeClass("show");
                $("#message").removeClass("show");
            });
            $(".new-game").on("click", function() {
                $("#overlay-bg").removeClass("show");
                $("#message").removeClass("show");
                Tiles.reset([], 3);
                Tiles.allowClicks = true;
            });

            Tiles.fetch({});

            this.render([], options.size);
        },
        render: function(collection, size) {
            this.$el.empty();   
            Tiles.boardSize = size;
            Tiles.horizontalWins()
                .verticalWins()
                .crossWins();

            if (Tiles.length === 0) {
                Tiles.newGame(size);
                this.$el.addClass("one");
                this.playerOne.addClass("one");
            } else {
                this.persistCollection();
            }

            _.each(Tiles.models, this.addTile, this);
        },
        persistCollection: function() {
            var clickedTiles = Tiles.where({hasBeenSelected: true});
            Tiles.numOfClicks = clickedTiles.length;
            var lastTile = _.max(
                Tiles.where({hasBeenSelected:true}), 
                function(tile) {
                    return tile.get("timeStamp");
            });
            if (Tiles.numOfClicks > 0) {            
                Tiles.numOfClicks += lastTile.get("selectedBy");
                if (Tiles.numOfClicks % 2 === 0) {
                    this.$el.addClass("one");
                    this.playerOne.addClass("one");
                        } else {
                    this.$el.addClass("two");
                    this.playerTwo.addClass("two");
                }
                Tiles.checkIfWin(lastTile);
            } else {
                this.$el.addClass("one");
                this.playerOne.addClass("one");
            }
            return lastTile;
        },
        addTile: function(tile) {
            var elString = "#tile" + tile.get("x") + tile.get("y");
            var newTileView = new TileView({
                    model: tile,
                });
            this.$el.append(newTileView.render());
            newTileView.setElement(elString);
            if (newTileView.model.get("hasBeenSelected") === true) {
                if (newTileView.model.get("selectedBy") === 0) {
                    newTileView.$el.addClass("one");
                } else if (newTileView.model.get("selectedBy") === 1) {
                    newTileView.$el.addClass("two");
                }
            }
        },
        win: function(tile) {
            Tiles.endOfGame();
            player = (tile.get("selectedBy") === 0) ? "Green" : "Orange";
            this.displayOverlay(player + " wins!");
        },
        tie: function() {
            this.displayOverlay("It's a tie!");
        },
        displayOverlay: function(text) {
            $("#overlay-bg").addClass("show");          
            $("#message").addClass("show");
            $("#message .title").html(text);    
        }
    });
    var App = new BoardView({
        size : 3
    });
});