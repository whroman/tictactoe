$(function() {
	var Tile = Backbone.Model.extend({
		defaults: function() {
			var order = Tiles.nextOrder();
			return {
				order: order,
				hasBeenSelected: false,
				selectedBy: ""
			};
		},

		x : "",
		y : "",
		win: function() {
			this.trigger("win", this)
		}

	});

	var All_Tiles = Backbone.Collection.extend({
		model: Tile,
		localStorage: new Backbone.LocalStorage("minesweeper"),
		numOfClicks: 0,
		boardSize: null,
		possibleWins: [],
		nextOrder: function() {
			if (!this.length) return 1;
			return this.last().get("order") + 1;
		},
		newGame: function(boardSize) {
			this.boardSize = boardSize;
			for ( var yy = 0; yy < boardSize; yy++ ) {
				for ( var xx = 0; xx < boardSize; xx++ ) {
					var tile = this.create({
						x: xx, 
						y: yy, 
					});
				};
			};
			this.horizontalWins();
			this.verticalWins();
			this.crossWins();
		},
		horizontalWins: function() {
			for (var yy = 0; yy < this.boardSize; yy++) {
				var wins = [];
				for (var xx = 0; xx < this.boardSize; xx++) {
					wins.push({
						x: xx,
						y: yy
					});
				};
				this.possibleWins.push(wins);
			};
		},
		verticalWins: function() {
			for (var xx = 0; xx < this.boardSize; xx++) {
				var wins = [];
				for (var yy = 0; yy < this.boardSize; yy++) {
					wins.push({
						x: xx,
						y: yy
					});
				};
				this.possibleWins.push(wins);
			};
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
			};
			this.possibleWins.push(topLeftBottomRight);
			this.possibleWins.push(bottomLeftTopRight);
		},
		selectedTiles: function(tile) {
			return this.where({"selectedBy": tile.get("selectedBy")})
		},
		checkGameState: function(tile) {
			var numSelectedTiles = Tiles.where({
				"hasBeenSelected": true
			}).length;
			if (numSelectedTiles == Tiles.boardSize * Tiles.boardSize) {
				tile.trigger("tie");
			} else {
				Tiles.checkWin(tile);
			};
		},
		checkWin: function(tile) {
			var playerTiles = Tiles.selectedTiles(tile),
				possibleWins = Tiles.possibleWins,
				playerTileCoords = [];
			for (var i = 0; i < playerTiles.length; i++) {
				playerTileCoords.push({
					x: playerTiles[i].get("x"),
					y: playerTiles[i].get("y")					
				});
			};
			for (var i = 0; i < possibleWins.length; i++) {
				var count = 0;
				for (var j = 0; j < possibleWins[i].length; j++) {
					for (var k = 0; k < playerTileCoords.length; k++) {
						if (possibleWins[i][j].x == playerTileCoords[k].x &&
							possibleWins[i][j].y == playerTileCoords[k].y) {
							count++;
						};
					};
				};
				if (count == Tiles.boardSize) {
					tile.win();
				};
			};
		},
		endOfGame: function() {
			_.each(this.models, function(tile) {
				tile.set("hasBeenSelected", true)
			})
		},
		comparator: "order",
	});

	var Tiles = new All_Tiles();

	var Tile_View = Backbone.View.extend({
	    template: _.template($('#tile-template').html()),
		events: {
			"click": "tileClick",
		},
		initialize: function() {
			this.listenTo(this.model, "change:selectedBy", this.markTile);
			this.listenTo(this.model, "change:hasBeenSelected", Tiles.checkGameState);
		},
		render: function() {
			return this.template(this.model.toJSON())
		},
		tileClick: function() {
			if (this.model.get("hasBeenSelected") == false) {
				var player = Tiles.numOfClicks % 2;
				this.model.set("selectedBy", player);
				this.model.set("hasBeenSelected", true);
				Tiles.numOfClicks++;				
			}
		},
		markTile: function() {
			var player = this.model.get("selectedBy");
			if (player == 0) {
				$(".player.one .tile").removeClass("one")
				$(".player.two .tile").addClass("two");
				this.$el.addClass("one");
			} else {
				$(".player.one .tile").addClass("one")
				$(".player.two .tile").removeClass("two");
				this.$el.addClass("two");
			}
		},

	});

	var Board_View = Backbone.View.extend({
		el: $("#board"),

		initialize: function(options) {
			var thisView = this;
			this.render([], options.size);
			this.listenTo(Tiles, "win", this.win);
			this.listenTo(Tiles, "tie", this.tie);
			this.listenTo(Tiles, "reset", this.render);
			$("#overlay-bg").on("click", function() {
				$(this).removeClass("show");
				$("#message").removeClass("show");
			});
			$("#message .new-game").on("click", function() {
				$("#overlay-bg").removeClass("show");
				$("#message").removeClass("show");
				Tiles.reset([], 3);
			})
		},
		render: function(collection, size) {
			this.$el.empty();			
		    Tiles.newGame(size);
		    _.each(Tiles.models, this.add_tile, this);
		},
		add_tile: function(tile) {
			var el_string = "#tile" + tile.get("x") + tile.get("y");
			var new_tile_view = new Tile_View({
					model: tile,
				});
			this.$el.append(new_tile_view.render());
			new_tile_view.setElement(el_string);
		},
		win: function(tile) {
			Tiles.endOfGame();
			player = (tile.get("selectedBy") == 0) ? "Green" : "Orange";
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
	
	var size = 3

	var App = new Board_View({
		size : size
	});		
});