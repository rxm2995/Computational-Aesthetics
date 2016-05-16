!function()
{
	var canvas, ctx, cellGrid, loopIntervalID;
	var underpopThreshold = document.querySelector("#underPopInput").value;
	var overpopThreshold = document.querySelector("#overPopInput").value;
	var reproduction = document.querySelector("#reproductionInput").value;
	var millisecondsPerGeneration = document.querySelector("#speedInput").value;
	var toroidal = true;
	var generateBlanks = false;
	var gridWidth = Math.round(window.innerWidth/10);
	var gridHeight = Math.round(window.innerHeight/10);
	var liveColor = "#000";
	var deadColor = "#fff";
	
	function init()
	{
		canvas = document.querySelector("canvas");
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight - canvas.getBoundingClientRect().top;
		
		document.querySelector("#widthInput").value = gridWidth;
		document.querySelector("#heightInput").value = gridHeight;

		document.querySelector("#underPopInput").onchange = function(e)
		{
			underpopThreshold = Math.max(e.target.min, Math.min(overpopThreshold, e.target.value));
			e.target.value = underpopThreshold;
			document.querySelector("#survivalMinInput").value = underpopThreshold;
		}
		document.querySelector("#survivalMinInput").onchange = function(e)
		{
			underpopThreshold = Math.max(e.target.min, Math.min(overpopThreshold, e.target.value));
			document.querySelector("#underPopInput").value = underpopThreshold;
			e.target.value = underpopThreshold;
		}
		
		document.querySelector("#overPopInput").onchange = function(e)
		{
			overpopThreshold = Math.max(underpopThreshold, Math.min(e.target.max, e.target.value));
			e.target.value = overpopThreshold;
			document.querySelector("#survivalMaxInput").value = overpopThreshold;
		}
		document.querySelector("#survivalMaxInput").onchange = function(e)
		{
			overpopThreshold = Math.max(underpopThreshold, Math.min(e.target.max, e.target.value));
			document.querySelector("#overPopInput").value = overpopThreshold;
			e.target.value = overpopThreshold;
		}
		
		document.querySelector("#reproductionInput").onchange = function(e)
		{
			reproduction = Math.max(e.target.min, Math.min(e.target.max, e.target.value));
			e.target.value = reproduction;
		}
		
		document.querySelector("#speedInput").onchange = function(e)
		{
			millisecondsPerGeneration = Math.max(0, e.target.value);
			window.clearInterval(loopIntervalID);
			loopIntervalID = setInterval(updateAndDraw, millisecondsPerGeneration);
		}
		
		document.querySelector("#pauseButton").onclick = function(e)
		{
			window.clearInterval(loopIntervalID);
			loopIntervalID = -1;
			e.target.className = "hidden";
			document.querySelector("#playButton").className = "";
			document.querySelector("#advanceButton").className = "";
		}
		//This wouldn't be necessary if setting the value to "&#9658; Play" here didn't set it to that exact text.
		document.querySelector("#playButton").onclick = function(e)
		{
			loopIntervalID = setInterval(updateAndDraw, millisecondsPerGeneration);
			document.querySelector("#pauseButton").className = "";
			e.target.className = "hidden";
			document.querySelector("#advanceButton").className = "hidden";
		}
		
		document.querySelector("#resetButton").onclick = function()
		{
			if(loopIntervalID != -1)
			{
				window.clearInterval(loopIntervalID);
			}
			millisecondsPerGeneration = 75;
			generateBlanks = false;
			toroidal = true;
			gridWidth = Math.round(window.innerWidth/10);
			gridHeight = Math.round(window.innerHeight/10);
			setDefaultSimRules();
			
			document.querySelector("#toroidCheckbox").checked = true;
			document.querySelector("#genCheckbox").checked = true;
			document.querySelector("#widthInput").value = gridWidth;
			document.querySelector("#heightInput").value = gridHeight;
			document.querySelector("#pauseButton").className = "";
			document.querySelector("#playButton").className = "hidden";
			document.querySelector("#speedInput").value = millisecondsPerGeneration;
			
			cellGrid = new Array(gridWidth);
			for(var x = 0; x < gridWidth; x++)
			{
				cellGrid[x] = new Array(gridHeight);
				for(var y = 0; y < gridHeight; y++)
				{
					cellGrid[x][y] = Math.round(Math.random());
				}
			}
			loopIntervalID = setInterval(updateAndDraw, millisecondsPerGeneration);
		}

		document.querySelector("#toroidCheckbox").onchange = function(e)
		{
			toroidal = e.target.checked;
		}
		document.querySelector("#genCheckbox").onchange = function(e)
		{
			generateBlanks = !e.target.checked;
		}

		document.querySelector("#interfaceToggle").onclick = function(e)
		{
			var ui = document.querySelector("#userInterface");
			if(ui.style.left == "-25%")
			{
				ui.style.left = "0%";
				e.target.innerHTML = "«";
			}
			else
			{
				ui.style.left = "-25%";
				e.target.innerHTML = "»";
			}
		};
		
		document.querySelector("#optionsToggle").onclick = function(e)
		{
			toggleSubmenu(e.target, document.querySelector("#optionsSubmenu"), "Grid Settings");
		}
		document.querySelector("#rulesToggle").onclick = function(e)
		{
			toggleSubmenu(e.target, document.querySelector("#rulesSubmenu"), "Rules");
		}
		document.querySelector("#presetToggle").onclick = function(e)
		{
			toggleSubmenu(e.target, document.querySelector("#presetSubmenu"), "Presets");
		}
		
		document.querySelector("#regenButton").onclick = fillGrid;
		document.querySelector("#clearButton").onclick = clearGrid;
		document.querySelector("#oscPreset").onclick = makeOscillator;
		document.querySelector("#glidePreset").onclick = makeGliders;
		document.querySelector("#pentaPreset").onclick = makePenta;
		document.querySelector("#gospPreset").onclick = makeGosper;
		document.querySelector("#linePreset").onclick = makeLines;
		document.querySelector("#advanceButton").onclick = updateAndDraw;

		document.querySelector("#widthInput").onchange = function(e)
		{
			e.target.value = Math.max(e.target.min, e.target.value);
			changeGridDimensions(e.target.value-gridWidth, 0);
		};
		
		document.querySelector("#heightInput").onchange = function(e)
		{
			e.target.value = Math.max(e.target.min, e.target.value);
			changeGridDimensions(0, e.target.value-gridHeight);
		};
		
		window.addEventListener('resize', function()
		{
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight - canvas.getBoundingClientRect().top;
			drawGrid();
		}, false);
		
		ctx = canvas.getContext("2d");
		
		cellGrid = new Array(gridWidth);
		for(var x = 0; x < gridWidth; x++)
		{
			cellGrid[x] = new Array(gridHeight);
			for(var y = 0; y < gridHeight; y++)
			{
				cellGrid[x][y] = Math.round(Math.random());
			}
		}
		
		loopIntervalID = setInterval(updateAndDraw, millisecondsPerGeneration);
	}
	
	function setDefaultSimRules()
	{
		underpopThreshold = 2;
		survivalMin = 2;
		survivalMax = 3;
		overpopThreshold = 3;
		reproduction = 3;
		document.querySelector("#underPopInput").value = underpopThreshold;
		document.querySelector("#survivalMinInput").value = survivalMin;
		document.querySelector("#survivalMaxInput").value = survivalMax;
		document.querySelector("#overPopInput").value = overpopThreshold;
		document.querySelector("#reproductionInput").value = reproduction;
	}
	
	function toggleSubmenu(header, sub, title)
	{
			if(sub.className == "hidden")
			{
				sub.className = "";
				header.innerHTML = "&#9660; "+title;
			}
			else
			{
				sub.className = "hidden";
				header.innerHTML = "&#9654; "+title;
			}
	}
	
	function updateAndDraw()
	{
		var cellGridCopy = new Array(gridWidth);
		for(var i = 0; i < gridWidth; i++)
		{
			cellGridCopy[i] = cellGrid[i].slice();
		}
		
		for(var x = 0; x < gridWidth; x++)
		{
			for(var y = 0; y < gridHeight; y++)
			{				
				//Getting count of live neighbors
				
				var neighbors = 0;
				neighbors += checkGridSquare(cellGridCopy, x+1, y+1);
				neighbors += checkGridSquare(cellGridCopy, x+1, y);
				neighbors += checkGridSquare(cellGridCopy, x+1, y-1);
				neighbors += checkGridSquare(cellGridCopy, x, y+1);
				neighbors += checkGridSquare(cellGridCopy, x, y-1);
				neighbors += checkGridSquare(cellGridCopy, x-1, y+1);
				neighbors += checkGridSquare(cellGridCopy, x-1, y);
				neighbors += checkGridSquare(cellGridCopy, x-1, y-1);
								
				
				//Determining cell state
				if(cellGrid[x][y] == 1) //If cell is alive
				{
					if(neighbors < underpopThreshold || neighbors > overpopThreshold)
					{
						cellGrid[x][y] = 0;
						ctx.fillStyle = deadColor;
					}
					else
					{
						ctx.fillStyle = liveColor;
					}
				}
				else //if cell is dead
				{
					if(neighbors == reproduction)
					{
						cellGrid[x][y] = 1;
						ctx.fillStyle = liveColor;
					}
					else
					{
						ctx.fillStyle = deadColor;
					}
				}
				
				//Drawing
				ctx.fillRect(canvas.width*x/gridWidth, canvas.height*y/gridHeight, canvas.width/gridWidth+1, canvas.height/gridHeight+1);
			}
		}
	}
	
	function checkGridSquare(array, x, y)
	{
		if(x < 0)
		{
			if(toroidal)
			{
				x = gridWidth-1;
			}
			else
			{
				return 0;
			}
		}
		else if(x >= gridWidth)
		{
			if(toroidal)
			{
				x = 0;
			}
			else
			{
				return 0;
			}
		}
		
		if(y < 0)
		{
			if(toroidal)
			{
				y = gridHeight-1;
			}
			else
			{
				return 0;
			}
		}
		else if(y >= gridHeight)
		{
			if(toroidal)
			{
				y = 0;
			}
			else
			{
				return 0;
			}
		}
		
		return array[x][y];
	}
	
	function changeGridDimensions(deltaWidth, deltaHeight)
	{
		if(deltaWidth != 0)
		{
			for(var x = 0; x < deltaWidth; x++)
			{
				cellGrid[gridWidth+x] = new Array(gridHeight);
				for(var y = 0; y < gridHeight; y++)
				{
					cellGrid[gridWidth+x][y] = (generateBlanks ? 0 : Math.round(Math.random()));
				}
			}
			gridWidth += deltaWidth;
			document.querySelector("#widthInput").value = gridWidth;
		}
		
		if(deltaHeight != 0)
		{
			for(var x = 0; x < gridWidth; x++)
			{
				for(var y = gridHeight; y < gridHeight+deltaHeight; y++)
				{
					cellGrid[x][y] = (generateBlanks ? 0 : Math.round(Math.random()));
				}
			}
			gridHeight += deltaHeight;
			document.querySelector("#heightInput").value = gridHeight;
		}
		//If either delta is negative, the new values of deltaWidth and deltaHeight will keep the excess data from being used in updateAndDraw(). No array pruning is necessary.
		
		//Drawing (so that changes can be reflected even while simulation is paused)
		drawGrid();
	}
	
	function drawGrid()
	{
		for(var x = 0; x < gridWidth; x++)
		{
			for(var y = 0; y < gridHeight; y++)
			{
				if(cellGrid[x][y] == 0)
				{
					ctx.fillStyle = deadColor;
				}
				else
				{
					ctx.fillStyle = liveColor;
				}
				ctx.fillRect(canvas.width*x/gridWidth, canvas.height*y/gridHeight, canvas.width/gridWidth+1, canvas.height/gridHeight+1);
			}
		}
	}
	
	function clearGrid()
	{
		for(var x = 0; x < gridWidth; x++)
		{
			for(var y = 0; y < gridHeight; y++)
			{
				cellGrid[x][y] = 0;
			}
		}
		drawGrid();
	}
	
	function fillGrid()
	{
		for(var x = 0; x < gridWidth; x++)
		{
			for(var y = 0; y < gridHeight; y++)
			{
				cellGrid[x][y] = Math.round(Math.random());
			}
		}
		drawGrid();
	}
	
	
	function makeOscillator()
	{
		changeGridDimensions(19-gridWidth, 19-gridHeight);
		setDefaultSimRules();
		clearGrid();
		
		cellGrid[6][2] = 1;
		cellGrid[6][3] = 1;
		cellGrid[6][4] = 1;
		cellGrid[7][4] = 1;
		
		cellGrid[6][7] = 1;
		cellGrid[6][8] = 1;
		cellGrid[7][6] = 1;
		cellGrid[7][8] = 1;
		cellGrid[8][6] = 1;
		cellGrid[8][7] = 1;
		
		cellGrid[2][6] = 1;
		cellGrid[3][6] = 1;
		cellGrid[4][6] = 1;
		cellGrid[4][7] = 1;
		
		cellGrid[11][4] = 1;
		cellGrid[12][2] = 1;
		cellGrid[12][3] = 1;
		cellGrid[12][4] = 1;
		
		cellGrid[10][6] = 1;
		cellGrid[10][7] = 1;
		cellGrid[11][6] = 1;
		cellGrid[11][8] = 1;
		cellGrid[12][7] = 1;
		cellGrid[12][8] = 1;
		
		cellGrid[14][6] = 1;
		cellGrid[14][7] = 1;
		cellGrid[15][6] = 1;
		cellGrid[16][6] = 1;
		
		cellGrid[6][10] = 1;
		cellGrid[6][11] = 1;
		cellGrid[7][10] = 1;
		cellGrid[7][12] = 1;
		cellGrid[8][11] = 1;
		cellGrid[8][12] = 1;
		
		cellGrid[10][11] = 1;
		cellGrid[10][12] = 1;
		cellGrid[11][10] = 1;
		cellGrid[11][12] = 1;
		cellGrid[12][10] = 1;
		cellGrid[12][11] = 1;
		
		cellGrid[2][12] = 1;
		cellGrid[3][12] = 1;
		cellGrid[4][11] = 1;
		cellGrid[4][12] = 1;
		
		cellGrid[14][11] = 1;
		cellGrid[14][12] = 1;
		cellGrid[15][12] = 1;
		cellGrid[16][12] = 1;
		
		cellGrid[6][14] = 1;
		cellGrid[6][15] = 1;
		cellGrid[6][16] = 1;
		cellGrid[7][14] = 1;
		
		cellGrid[11][14] = 1;
		cellGrid[12][14] = 1;
		cellGrid[12][15] = 1;
		cellGrid[12][16] = 1;
		
		drawGrid();
	}
	
	function makeGliders()
	{
		changeGridDimensions(30-gridWidth, 30-gridHeight);
		setDefaultSimRules();
		toroidal = true;
		document.querySelector("#toroidCheckbox").checked = toroidal;
		clearGrid();
		
		
		cellGrid[1][4] = 1;
		cellGrid[1][6] = 1;
		cellGrid[2][3] = 1;
		cellGrid[3][3] = 1;
		cellGrid[4][3] = 1;
		cellGrid[4][6] = 1;
		cellGrid[5][3] = 1;
		cellGrid[5][4] = 1;
		cellGrid[5][5] = 1;
		
		
		cellGrid[17][1] = 1;
		cellGrid[15][1] = 1;
		cellGrid[18][2] = 1;
		cellGrid[18][3] = 1;
		cellGrid[18][4] = 1;
		cellGrid[15][4] = 1;
		cellGrid[18][5] = 1;
		cellGrid[17][5] = 1;
		cellGrid[16][5] = 1;
		
		
		drawGrid();
	}
	
	function makePenta()
	{
		changeGridDimensions(11-gridWidth, 18-gridHeight);
		setDefaultSimRules();
		clearGrid();
		
		cellGrid[5][4] = 1;
		cellGrid[5][5] = 1;
		cellGrid[4][6] = 1;
		cellGrid[6][6] = 1;
		cellGrid[5][7] = 1;
		cellGrid[5][8] = 1;
		cellGrid[5][9] = 1;
		cellGrid[5][10] = 1;
		cellGrid[4][11] = 1;
		cellGrid[6][11] = 1;
		cellGrid[5][12] = 1;
		cellGrid[5][13] = 1;
		
		drawGrid();
	}
	
	function makeGosper()
	{
		
		changeGridDimensions(80-gridWidth, 60-gridHeight);
		setDefaultSimRules();
		toroidal = false;
		document.querySelector("#toroidCheckbox").checked = toroidal;
		clearGrid();
		
		cellGrid[1][5] = 1;
		cellGrid[1][6] = 1;
		cellGrid[2][5] = 1;
		cellGrid[2][6] = 1;
		
		cellGrid[13][3] = 1;
		cellGrid[14][3] = 1;
		cellGrid[12][4] = 1;
		cellGrid[16][4] = 1;
		cellGrid[11][5] = 1;
		cellGrid[17][5] = 1;
		cellGrid[11][6] = 1;
		cellGrid[15][6] = 1;
		cellGrid[17][6] = 1;
		cellGrid[18][6] = 1;
		cellGrid[11][7] = 1;
		cellGrid[17][7] = 1;
		cellGrid[12][8] = 1;
		cellGrid[16][8] = 1;
		cellGrid[13][9] = 1;
		cellGrid[14][9] = 1;
		
		cellGrid[25][1] = 1;
		cellGrid[23][2] = 1;
		cellGrid[25][2] = 1;
		cellGrid[21][3] = 1;
		cellGrid[22][3] = 1;
		cellGrid[21][4] = 1;
		cellGrid[22][4] = 1;
		cellGrid[21][5] = 1;
		cellGrid[22][5] = 1;
		cellGrid[23][6] = 1;
		cellGrid[25][6] = 1;
		cellGrid[25][7] = 1;
		
		cellGrid[35][3] = 1;
		cellGrid[36][3] = 1;
		cellGrid[35][4] = 1;
		cellGrid[36][4] = 1;
		
		drawGrid();
	}
	
	function makeLines()
	{
		
		changeGridDimensions(57-gridWidth, 43-gridHeight);
		setDefaultSimRules();
		toroidal = false;
		document.querySelector("#toroidCheckbox").checked = toroidal;
		clearGrid();
		
		cellGrid[8][21] = 1;
		cellGrid[9][21] = 1;
		cellGrid[10][21] = 1;
		cellGrid[11][21] = 1;
		cellGrid[12][21] = 1;
		cellGrid[13][21] = 1;
		cellGrid[14][21] = 1;
		cellGrid[15][21] = 1;
		
		cellGrid[17][21] = 1;
		cellGrid[18][21] = 1;
		cellGrid[19][21] = 1;
		cellGrid[20][21] = 1;
		cellGrid[21][21] = 1;
		
		cellGrid[25][21] = 1;
		cellGrid[26][21] = 1;
		cellGrid[27][21] = 1;
		
		cellGrid[34][21] = 1;
		cellGrid[35][21] = 1;
		cellGrid[36][21] = 1;
		cellGrid[37][21] = 1;
		cellGrid[38][21] = 1;
		cellGrid[39][21] = 1;
		cellGrid[40][21] = 1;
		cellGrid[41][21] = 1;
		
		cellGrid[43][21] = 1;
		cellGrid[44][21] = 1;
		cellGrid[45][21] = 1;
		cellGrid[46][21] = 1;
		cellGrid[47][21] = 1;
		
		drawGrid();
	}
	
	window.onload = init;
}();