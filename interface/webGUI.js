"use strict";

if(typeof console === "undefined"){
    console = {};
}

var CONTROLLED_ROBOT = 4
var AUTONOMOUS_ROBOT = 3

var strategySelected = 0

var tempoRimanente = undefined
var canvas;
var gl;

var showMesh, showNormals, showContours, showLightPosition, showTexture;

DEFAULT_CANVAS_FIELD_WIDTH = 5400;
DEFAULT_CANVAS_FIELD_HEIGHT = 7400;

CURRENT_CANVAS_FIELD_WIDTH = 5400;
CURRENT_CANVAS_FIELD_HEIGHT = 7400;

CURRENT_BORDER_STRIP_WIDTH = 700;

var CURRENT_FIELD_WIDTH = CURRENT_CANVAS_FIELD_WIDTH - CURRENT_BORDER_STRIP_WIDTH;
var CURRENT_FIELD_HEIGHT = CURRENT_CANVAS_FIELD_HEIGHT - CURRENT_BORDER_STRIP_WIDTH;

var CANVAS_RESOLUTION_FACTOR = 0.4;

var CANVAS_FIELD_WIDTH = Math.floor(CURRENT_CANVAS_FIELD_WIDTH * CANVAS_RESOLUTION_FACTOR);
var CANVAS_FIELD_HEIGHT = Math.floor(CURRENT_CANVAS_FIELD_HEIGHT * CANVAS_RESOLUTION_FACTOR);

var FIELD_WIDTH = Math.floor(CURRENT_FIELD_WIDTH * CANVAS_RESOLUTION_FACTOR);
var FIELD_HEIGHT = Math.floor(CURRENT_FIELD_HEIGHT * CANVAS_RESOLUTION_FACTOR);

function mapValueToCurrentField(value)
{
    return Utils.mapValue(value, 0, CURRENT_CANVAS_FIELD_WIDTH, 0, DEFAULT_CANVAS_FIELD_WIDTH)
}

function mapValueToCurrentCanvas(value)
{
    return Utils.mapValue(value, 0, CANVAS_FIELD_WIDTH, 0, CURRENT_CANVAS_FIELD_WIDTH);
}

var FieldDimensions = 
{
    FIELD_LINES_WIDTH : mapValueToCurrentCanvas(mapValueToCurrentField(50)),

    CENTER_CIRCLE_RADIUS : mapValueToCurrentCanvas(mapValueToCurrentField(500)),
    CENTER_DOT_RADIUS : mapValueToCurrentCanvas(mapValueToCurrentField(35)),

    Y_POS_SIDE_LINE : mapValueToCurrentCanvas(mapValueToCurrentField(3200)),
    X_POS_SIDE_LINE : mapValueToCurrentCanvas(mapValueToCurrentField(2300)),

    PENALTY_AREA_WIDTH : mapValueToCurrentCanvas(mapValueToCurrentField(3000)),
    PENALTY_AREA_HEIGHT : mapValueToCurrentCanvas(mapValueToCurrentField(1400)),

    SMALL_PENALTY_AREA_WIDTH : mapValueToCurrentCanvas(mapValueToCurrentField(1600)),
    SMALL_PENALTY_AREA_HEIGHT : mapValueToCurrentCanvas(mapValueToCurrentField(600)),

    PENALTY_CROSS_SIZE : mapValueToCurrentCanvas(mapValueToCurrentField(100)),
    PENALTY_CROSS_X_DISTANCE : mapValueToCurrentCanvas(mapValueToCurrentField(1300)),
    X_POS_PENALTY_CROSS : this.X_POS_SIDE_LINE - this.PENALTY_CROSS_X_DISTANCE,
    GOAL_POST_RADIUS : mapValueToCurrentCanvas(mapValueToCurrentField(40)),
    GOAL_POST_WIDTH : mapValueToCurrentCanvas(mapValueToCurrentField(1500)),
    GOAL_POST_HEIGHT : mapValueToCurrentCanvas(mapValueToCurrentField(500)),
    TARGET_RADIUS : mapValueToCurrentCanvas(mapValueToCurrentField(100)),
    BALL_RADIUS : mapValueToCurrentCanvas(mapValueToCurrentField(100)),
    ROBOT_RADIUS : mapValueToCurrentCanvas(mapValueToCurrentField(150)),
    OBSTACLE_RADIUS : this.ROBOT_RADIUS,
}

var fieldBackgroundColor = "#00FF00";
var fieldLinesColor = "#00FF00";
var ballColor = "#00FF00";
var robotColor = "#00FF00";
var obstacleColor = "";
var goalColor = "";
var targetPositionColor = "";

var canvasTextColor = "#FFFFFF";
var canvasContainerBackgroundColor = "#DDDDEE";
var canvasBackgroundColor = "#00BB00";


var robotNumbersToPositions = new Map();
var robotTeammatesNumbersToPositions = new Map();
var ballPosition = [];
var obstaclesPositions = [];

//Task received and completed
var lastReceivedTaskID = -1;
var lastReceivedStrategyID = -1;
var lastCompletedTaskID = -1;

//Task list
var currentTaskList = [];
var currentTaskPreviews = [];

var mouseOverCanvas = false;

function drawCircle(ctx, centerX, centerY, radius, fillColor = undefined, lineColor = "#000000", lineWidth = 5, withRespectToCenter = undefined)
{
    if(withRespectToCenter != undefined)
    {
        centerX = centerX + withRespectToCenter[0];
        centerY = centerY + withRespectToCenter[1];
    }

    console.log(centerX)
    console.log(centerY)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    
    if(fillColor == undefined)
        fillColor = canvasBackgroundColor;
        ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
}

function drawSemiCircle(ctx, centerX, centerY, radius, fillColor = undefined, lineColor = "#000000", lineWidth = 5, withRespectToCenter = undefined, startAngle = 0, endAngle = Math.PI)
{
    if(withRespectToCenter != undefined)
    {
        centerX = centerX + withRespectToCenter[0];
        centerY = centerY + withRespectToCenter[1];
    }

    console.log(centerX);
    console.log(centerY);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    
    if(fillColor == undefined)
        fillColor = canvasBackgroundColor;
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
}

function drawTextLabel(ctx, xPos, yPos, text, color, size, withRespectToCenter = undefined)
{
    if(withRespectToCenter != undefined)
    {
        xPos = xPos + withRespectToCenter[0];
        yPos = yPos + withRespectToCenter[1];
    }

    ctx.font = size+"px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(text, xPos, yPos);
}

function drawLine(ctx, fromX, fromY, toX, toY, lineColor = "#000000", lineWidth = 5, withRespectToCenter = undefined)
{
    if(withRespectToCenter != undefined)
    {
        fromX = fromX + withRespectToCenter[0];
        toX = toX + withRespectToCenter[0];

        fromY = fromY + withRespectToCenter[1];
        toY = toY + withRespectToCenter[1];
    }

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.stroke();
}

//Taken from https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
function drawArrow(ctx, fromX, fromY, toX, toY, lineColor = "#000000", lineWidth = 20, arrowHeadLength = 50, withRespectToCenter = undefined) 
{
    if(withRespectToCenter != undefined)
    {
        fromX = fromX + withRespectToCenter[0];
        toX = toX + withRespectToCenter[0];

        fromY = fromY + withRespectToCenter[1];
        toY = toY + withRespectToCenter[1];
    }
    
    var dx = toX - fromX;
    var dy = toY - fromY;
    var angle = Math.atan2(dy, dx);


    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - arrowHeadLength * Math.cos(angle - Math.PI / 6), toY - arrowHeadLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - arrowHeadLength * Math.cos(angle + Math.PI / 6), toY - arrowHeadLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawRectangle(ctx, topLeftX, topLeftY, width, length, fillColor = undefined, lineColor = "#000000", lineWidth = 5, withRespectToCenter = undefined)
{
    if(withRespectToCenter != undefined)
    {
        topLeftX = topLeftX + withRespectToCenter[0];
        topLeftY = topLeftY + withRespectToCenter[1];
    }
        
    ctx.fillStyle = fillColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = lineColor;
    ctx.fillRect(topLeftX, topLeftY, width, length); 
    ctx.stroke();

}

function drawField(canvas)
{
    var ctx = canvas.getContext('2d');
    

    drawRectangle(ctx, 0, 0, canvas.width, canvas.height, canvasBackgroundColor, "#FFFFFF", 5)

    drawCircle(ctx, 0, 0, FieldDimensions.CENTER_CIRCLE_RADIUS, canvasBackgroundColor, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawCircle(ctx, 0, 0, FieldDimensions.CENTER_DOT_RADIUS, canvasBackgroundColor, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, FieldDimensions.X_POS_SIDE_LINE, 0, -FieldDimensions.X_POS_SIDE_LINE, 0, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    
    
    drawLine(ctx, FieldDimensions.X_POS_SIDE_LINE, FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.X_POS_SIDE_LINE, FieldDimensions.Y_POS_SIDE_LINE, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.X_POS_SIDE_LINE, -FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.X_POS_SIDE_LINE, -FieldDimensions.Y_POS_SIDE_LINE, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, -FieldDimensions.X_POS_SIDE_LINE, -FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.X_POS_SIDE_LINE, FieldDimensions.Y_POS_SIDE_LINE, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.X_POS_SIDE_LINE, -FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.X_POS_SIDE_LINE, FieldDimensions.Y_POS_SIDE_LINE, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, FieldDimensions.PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.PENALTY_AREA_HEIGHT, -FieldDimensions.PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, -FieldDimensions.PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions. PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    
    drawLine(ctx, FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, -FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, -FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    



    drawLine(ctx, FieldDimensions.PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.PENALTY_AREA_HEIGHT, -FieldDimensions.PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, -FieldDimensions.PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, -FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, -FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.SMALL_PENALTY_AREA_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.SMALL_PENALTY_AREA_HEIGHT, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawCircle(ctx, 0, -FieldDimensions.PENALTY_AREA_HEIGHT/2-550, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, -FieldDimensions.X_POS_PENALTY_CROSS, FieldDimensions.PENALTY_CROSS_SIZE/2, -FieldDimensions.X_POS_PENALTY_CROSS, -FieldDimensions.PENALTY_CROSS_SIZE/2, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, -FieldDimensions.X_POS_PENALTY_CROSS - FieldDimensions.PENALTY_CROSS_SIZE/2, 0, -FieldDimensions.X_POS_PENALTY_CROSS + FieldDimensions.PENALTY_CROSS_SIZE/2, 0, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawLine(ctx, FieldDimensions.X_POS_PENALTY_CROSS, FieldDimensions.PENALTY_CROSS_SIZE/2, FieldDimensions.X_POS_PENALTY_CROSS, -FieldDimensions.PENALTY_CROSS_SIZE/2, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.X_POS_PENALTY_CROSS + FieldDimensions.PENALTY_CROSS_SIZE/2, 0, FieldDimensions.X_POS_PENALTY_CROSS - FieldDimensions.PENALTY_CROSS_SIZE/2, 0, "#FFFFFF", FieldDimensions.FIELD_LINES_WIDTH, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    drawCircle(ctx, 0, FieldDimensions.PENALTY_AREA_HEIGHT/2+550, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
        
    drawRectangle(ctx, -FieldDimensions.GOAL_POST_WIDTH/2,-FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.GOAL_POST_HEIGHT, FieldDimensions.GOAL_POST_WIDTH, FieldDimensions.GOAL_POST_HEIGHT, "#CCCCCC", "#FFFFFF", 1, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2])
    drawLine(ctx, -FieldDimensions.GOAL_POST_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.GOAL_POST_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.GOAL_POST_HEIGHT, "#FFFFFF", FieldDimensions.GOAL_POST_RADIUS/2, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.GOAL_POST_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.GOAL_POST_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.GOAL_POST_HEIGHT, "#FFFFFF", FieldDimensions.GOAL_POST_RADIUS/2, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, -FieldDimensions.GOAL_POST_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.GOAL_POST_HEIGHT, FieldDimensions.GOAL_POST_WIDTH/2, -FieldDimensions.Y_POS_SIDE_LINE - FieldDimensions.GOAL_POST_HEIGHT, "#FFFFFF", FieldDimensions.GOAL_POST_RADIUS/2, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawCircle(ctx, -FieldDimensions.GOAL_POST_WIDTH/2 - FieldDimensions.GOAL_POST_RADIUS/2, -FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawCircle(ctx, FieldDimensions.GOAL_POST_WIDTH/2 + FieldDimensions.GOAL_POST_RADIUS/2, -FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    
    drawRectangle(ctx, -FieldDimensions.GOAL_POST_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.GOAL_POST_WIDTH, FieldDimensions.GOAL_POST_HEIGHT, "#CCCCCC", "#FFFFFF", 1, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2])
    drawLine(ctx, -FieldDimensions.GOAL_POST_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE, -FieldDimensions.GOAL_POST_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.GOAL_POST_HEIGHT, "#FFFFFF", FieldDimensions.GOAL_POST_RADIUS/2, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, FieldDimensions.GOAL_POST_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.GOAL_POST_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.GOAL_POST_HEIGHT, "#FFFFFF", FieldDimensions.GOAL_POST_RADIUS/2, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawLine(ctx, -FieldDimensions.GOAL_POST_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.GOAL_POST_HEIGHT, FieldDimensions.GOAL_POST_WIDTH/2, FieldDimensions.Y_POS_SIDE_LINE + FieldDimensions.GOAL_POST_HEIGHT, "#FFFFFF", FieldDimensions.GOAL_POST_RADIUS/2, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawCircle(ctx, -FieldDimensions.GOAL_POST_WIDTH/2 - FieldDimensions.GOAL_POST_RADIUS/2, FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawCircle(ctx, FieldDimensions.GOAL_POST_WIDTH/2 + FieldDimensions.GOAL_POST_RADIUS/2,     FieldDimensions.Y_POS_SIDE_LINE, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    
}

function scaleFieldPositionToCanvas(canvas, xFieldPos, yFieldPos)
{
    var boundingRect = canvas.getBoundingClientRect();

    var unscaledMouseXOnCanvas = Math.round(Utils.mapValue(xFieldPos, 0, canvas.width, -Math.floor(CURRENT_CANVAS_FIELD_WIDTH/2), Math.floor(CURRENT_CANVAS_FIELD_WIDTH/2)));
    var unscaledMouseYOnCanvas = Math.round(Utils.mapValue(yFieldPos, 0, canvas.height, -Math.floor(CURRENT_CANVAS_FIELD_HEIGHT/2), Math.floor(CURRENT_CANVAS_FIELD_HEIGHT/2)));

    return [unscaledMouseXOnCanvas, unscaledMouseYOnCanvas]

}

function scaleMousePositionToField(canvas, xPos, yPos)
{
    var boundingRect = canvas.getBoundingClientRect();

    //The canvas bitmap has a different size wrt the actual canvas size, so we need to scale it
    var scaleX = canvas.width / boundingRect.width;    
    var scaleY = canvas.height / boundingRect.height;  

    var mouseXOnCanvas = Math.round((xPos - boundingRect.left) * scaleX);  
    var mouseYOnCanvas = Math.round((yPos - boundingRect.top) * scaleY);     

    var scaledMouseXOnCanvas = Math.round(Utils.mapValue(mouseXOnCanvas, -Math.floor(CURRENT_CANVAS_FIELD_WIDTH/2), Math.floor(CURRENT_CANVAS_FIELD_WIDTH/2), 0, canvas.width));
    var scaledMouseYOnCanvas = Math.round(Utils.mapValue(mouseYOnCanvas, -Math.floor(CURRENT_CANVAS_FIELD_HEIGHT/2), Math.floor(CURRENT_CANVAS_FIELD_HEIGHT/2), 0, canvas.height));

    return [scaledMouseXOnCanvas, scaledMouseYOnCanvas]
}

function viewportMouseToCanvasCoordinates(canvas, xPos, yPos)
{
    var boundingRect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / boundingRect.width;    
    var scaleY = canvas.height / boundingRect.height;  
    return [(xPos - boundingRect.left) * scaleX, (yPos - boundingRect.top) * scaleY];
}

function drawRobot(ctx, robotNumber, angle, xPos, yPos, isActiveRobot = false, isActiveTeammateRobot = false)
{
    var fillColor = "#AAAAAA";
    var lineColor = "#000000";

    if(isActiveRobot || isActiveTeammateRobot)
    {
        fillColor = "#00FF00";
        lineColor = "#0000FF";
    }
    drawCircle(ctx, xPos, yPos, FieldDimensions.ROBOT_RADIUS, fillColor, lineColor, 
                mapValueToCurrentCanvas(mapValueToCurrentField(20)), //border width 
                [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    drawArrow(ctx, xPos, yPos, xPos+FieldDimensions.ROBOT_RADIUS*2*Math.cos(angle), yPos-FieldDimensions.ROBOT_RADIUS*2*Math.sin(angle), lineColor, 
                mapValueToCurrentCanvas(mapValueToCurrentField(20)), //border width 
                mapValueToCurrentCanvas(mapValueToCurrentField(50)), //arrow head length
                [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
    if(robotNumber == CONTROLLED_ROBOT) {
        var labelRobot = "Controlled Robot" 
    } else {
        labelRobot = "Autonomous Robot"
    }
    drawTextLabel(ctx, 
                    xPos + FieldDimensions.ROBOT_RADIUS * 2, 
                    yPos - FieldDimensions.ROBOT_RADIUS * 1.5, labelRobot, "#0000FF", 95,
                    [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2])
}

function drawBall(ctx)
{
    drawCircle(ctx, 
            mapValueToCurrentCanvas(mapValueToCurrentField(ballPosition[0])), 
            mapValueToCurrentCanvas(mapValueToCurrentField(ballPosition[1])), 
            FieldDimensions.BALL_RADIUS, "#FFFFFF", "#000000", 
            mapValueToCurrentCanvas(mapValueToCurrentField(20)), 
            [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2])
            
    drawTextLabel(ctx, 
        mapValueToCurrentCanvas(mapValueToCurrentField(ballPosition[0])) + FieldDimensions.BALL_RADIUS * 2, 
        mapValueToCurrentCanvas(mapValueToCurrentField(ballPosition[1])) + FieldDimensions.BALL_RADIUS * 2, "Ball", "#444444", 95,
        [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2])
};

function drawTargetOnField(canvas, xPos, yPos, targetColor)
{
    var ctx = canvas.getContext('2d');
    
    drawCircle(ctx, xPos, yPos, FieldDimensions.TARGET_RADIUS, canvasBackgroundColor, targetColor, 
               mapValueToCurrentCanvas(mapValueToCurrentField(40)) );
    drawLine(ctx, xPos, yPos+FieldDimensions.TARGET_RADIUS*3/2, xPos, yPos-FieldDimensions.TARGET_RADIUS*3/2, targetColor,
             mapValueToCurrentCanvas(mapValueToCurrentField(40)) )
    drawLine(ctx, xPos+FieldDimensions.TARGET_RADIUS*3/2, yPos, xPos-FieldDimensions.TARGET_RADIUS*3/2, yPos, targetColor, 
             mapValueToCurrentCanvas(mapValueToCurrentField(40)) )
}

function drawTargetPreviewOnField(canvas, debugInfo=false, scaledTargetPos = undefined, targetColor = "#FFFFFF")
{
    if(!mouseOverCanvas) return
    var unscaledTarget;
    var scaledTarget;
    if(scaledTargetPos == undefined)
    {
        unscaledTarget = canvas.unscaledMousePositionOnCanvas;
        scaledTarget = canvas.scaledMousePositionOnCanvas;    
    }
    else
    {
        x-special/nautilus-clipboard
        unscaledTarget = scaleFieldPositionToCanvas(canvas, scaledTargetPos[0], scaledTargetPos[1])
        scaledTarget = scaledTargetPos;
    }

    if(debugInfo)
    {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = canvasTextColor;
        ctx.font = mapValueToCurrentCanvas(mapValueToCurrentField(180))+"px Arial";
        ctx.fillText("X: "+scaledTarget[0]+", Y: "+-scaledTarget[1], 
                    mapValueToCurrentCanvas(mapValueToCurrentField(280)),
                    mapValueToCurrentCanvas(mapValueToCurrentField(300)) );
    }

    console.log("Drawing target preview: "+unscaledTarget)
    drawTargetOnField(canvas, unscaledTarget[0], unscaledTarget[1], targetColor)
}

function drawObstacles(ctx)
{
    console.log("START")
    for(var obs of obstaclesPositions)
    {
        drawCircle(ctx, 
                mapValueToCurrentCanvas(mapValueToCurrentField(obs[0])), 
                mapValueToCurrentCanvas(mapValueToCurrentField(obs[1])), 
                FieldDimensions.ROBOT_RADIUS, "#FF0000", "#000000", 
                mapValueToCurrentCanvas(mapValueToCurrentField(20)), 
                [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2])
                
        drawTextLabel(ctx, 
            mapValueToCurrentCanvas(mapValueToCurrentField(obs[0])) + FieldDimensions.ROBOT_RADIUS * 2, 
            mapValueToCurrentCanvas(mapValueToCurrentField(obs[1])) + FieldDimensions.ROBOT_RADIUS * 2, "Obstacle", "#FF0000", 95,
            [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2])
    }
}

function drawObjects(canvas)
{
    var ctx = canvas.getContext("2d")
    
    //Draw the ball
    drawBall(ctx)
    //Draw the active robots
    for( const [robotNumber, robotPosition] of Object.entries(robotNumbersToPositions)) 
    {
        drawRobot(ctx, robotNumber, 
                    robotPosition[0], 
                    Utils.mapValue(robotPosition[1], -CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_WIDTH/2, -CURRENT_CANVAS_FIELD_WIDTH/2, CURRENT_CANVAS_FIELD_WIDTH/2),
                    Utils.mapValue(robotPosition[2], -CANVAS_FIELD_HEIGHT/2, CANVAS_FIELD_HEIGHT/2, -CURRENT_CANVAS_FIELD_HEIGHT/2, CURRENT_CANVAS_FIELD_HEIGHT/2), 
                    robotNumber == CONTROLLED_ROBOT, robotNumber == AUTONOMOUS_ROBOT)
    };
    drawObstacles(ctx)
}

function drawCanvas()
{
    var canvas = document.getElementById("field-canvas");
    //Draw the static field
    //console.log("drawField")
    drawField(canvas, canvas.height, canvas.height);
    
    
    //console.log("drawTarget")
    //Draw the target for the currently selected task button (if there is one)
    if(canvas.currentlySelectedTaskButton != undefined && canvas.currentlySelectedTaskButton.selectionMode != "noSelection")
        drawTargetPreviewOnField(canvas, true)    
    
    //console.log("drawObjects")
    //Draw the ball, the robot positions and the obstacle positions
    drawObjects(canvas)
}


function startRenderingLoop()
{
    if(!CLIENT_ENABLED) return;

    console.log("START RENDER")
    var lastRender = 0
    
    function renderingLoop(timestamp)
    {
        if(!CLIENT_ENABLED) return
        
        
        drawCanvas()
        
        lastRender = timestamp
        
        window.requestAnimationFrame(renderingLoop)
    }

    window.requestAnimationFrame(renderingLoop)
}

function sendNewTask(selectedRobot, taskType, taskLabel, selectionMode, strategySelected, xPos=undefined, yPos=undefined)
{
    if(selectionMode === "noSelection")
    {
        sendToWebSocket("taskType:"+selectedRobot+","+selectionMode+","+taskType+","+(lastReceivedTaskID+1)+","+ taskLabel + "," + strategySelected);
    }
    else
    {
        sendToWebSocket("taskType:"+selectedRobot+","+selectionMode+","+taskType+","+(lastReceivedTaskID+1)+","+ taskLabel + "," + strategySelected + "," + xPos+","+-yPos);
    }
}

//--------------
//| WEBSOCKET  |
//--------------


//Taken from https://www.codegrepper.com/code-examples/javascript/javascript+generate+unique+hash
var CLIENT_ID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
});

function generateHeader()
{
    return "TOSERVER!clientID,"+CLIENT_ID+";robotNumber,"+3+";robotTeammateNumber,"+4+"|";
}

function sendToWebSocket(message)
{
    console.log(webSocket.readyState)
    if(webSocket.readyState === WebSocket.OPEN)
    {
        console.log("Sending message: "+message)
        webSocket.send(generateHeader() + message);
    }
}

function disableClient(reason)
{
    CLIENT_ENABLED = false;
    clearInterval(keepalive_send_timeout);
    clearInterval(keepalive_receive_timeout);
    console.log("Disabling client (reason: "+reason+")")

    document.getElementById("body").style.visibility = "hidden";
    document.getElementById("tasks-tab").innerHTML = "";
    //document.getElementById("simple-tasks-tab2").innerHTML = "";
    //document.getElementById("complex-tasks-tab").innerHTML = "";
    currentTaskList = [];
    currentSocket = undefined;

}

function createTaskAssignmentButton(tab, taskLabel, taskType, selectionMode) {

    var outerDiv = document.createElement("DIV");
    outerDiv.classList.add("settings-horizontal-container")
    outerDiv.style.height = "18%";

    var middleDiv = document.createElement("DIV");  
    middleDiv.classList.add("settings-horizontal-container")  
    middleDiv.style.height = "80%";
    outerDiv.appendChild(middleDiv);
    
    var innerDiv = document.createElement("DIV");   
    innerDiv.classList.add("settings-horizontal-container")        
    innerDiv.style.height = "100%";
    innerDiv.style.width = "100%";     
    innerDiv.style.justifyContent = "space-around"; 
    middleDiv.appendChild(innerDiv);
              
    var btn = document.createElement("BUTTON");
    btn.classList.add("settings-horizontal-container")
    btn.innerHTML = taskLabel;
    btn.taskLabel = taskLabel;
    btn.taskType = taskType;
    btn.selectionMode = selectionMode;

    btn.onmousedown = function(e){
        var canvas = document.getElementById("field-canvas");
        
        //Unselect the other selected task button if there is one
        if(canvas.currentlySelectedTaskButton != undefined)
        {
            toggleButton(canvas.currentlySelectedTaskButton)
            toggleTaskButtonSelection(canvas.currentlySelectedTaskButton);
        }
        
        if(selectionMode === "noSelection")
        {
            toggleButton(e.target)
            setTimeout(function () {toggleButton(e.target)}, 200)
            sendNewTask(CONTROLLED_ROBOT, btn.taskType, taskLabel, "noSelection", strategySelected);               
        }
        else
        {
            toggleButton(e.target);
            toggleTaskButtonSelection(e.target);
        }
    };

    innerDiv.appendChild(btn);               

    var tasksTab = document.getElementById(tab);
    tasksTab.appendChild(outerDiv);               
}

function createStrategyAssignmentButton(tab, strategyLabel, strategyNumber, selectionMode) {

    var outerDiv = document.createElement("DIV");
    outerDiv.classList.add("settings-horizontal-container")
    outerDiv.style.height = "18%";

    var middleDiv = document.createElement("DIV");  
    middleDiv.classList.add("settings-horizontal-container")  
    middleDiv.style.height = "80%";
    outerDiv.appendChild(middleDiv);
    
    var innerDiv = document.createElement("DIV");   
    innerDiv.classList.add("settings-horizontal-container")        
    innerDiv.style.height = "100%";
    innerDiv.style.width = "100%";     
    innerDiv.style.justifyContent = "space-around"; 
    middleDiv.appendChild(innerDiv);
              
    var btn = document.createElement("BUTTON");
    btn.classList.add("settings-horizontal-container")
    btn.innerHTML = strategyLabel;
    btn.strategyNumber = strategyNumber;
    btn.selectionMode = selectionMode;

    btn.onmousedown = function(e) {
        if (canvas.currentlySelectedStrategyButton === e.target) {
            // If the currently selected button is the same as the clicked button, deselect it
            toggleButton(e.target);
            toggleStrategyButtonSelection(e.target);
            canvas.currentlySelectedStrategyButton = undefined;
            strategySelected = 0;
        } else {
            if (canvas.currentlySelectedStrategyButton != undefined) {
                // Deselect the previously selected button
                toggleButton(canvas.currentlySelectedStrategyButton);
                toggleStrategyButtonSelection(canvas.currentlySelectedStrategyButton);
            }
            // Select the new button
            strategySelected = strategyNumber;
            toggleButton(e.target);
            toggleStrategyButtonSelection(e.target);
            // Update the currently selected button
            canvas.currentlySelectedStrategyButton = e.target;
        }
    };
    innerDiv.appendChild(btn);               

    var tasksTab = document.getElementById(tab);
    tasksTab.appendChild(outerDiv);               
}

function createTableTask(tabId, id, strategy, task, undoButton) {
    var tab = document.getElementById(tabId);

    var outerDiv = document.createElement("DIV");
    outerDiv.classList.add("row-container");
    outerDiv.style.display = "flex";
    outerDiv.style.justifyContent = "space-between";
    outerDiv.style.alignItems = "center";
    outerDiv.style.width = "100%";
    outerDiv.style.paddingTop = "5%";
    outerDiv.style.padding = "13px";
    outerDiv.style.border = "3px solid #ccc";

    var labelDiv1 = document.createElement("DIV");
    labelDiv1.classList.add("column");
    labelDiv1.innerHTML = id;
    labelDiv1.style.flex = "1";
    labelDiv1.style.fontSize = "1.0em";

    var labelDiv2 = document.createElement("DIV");
    labelDiv2.classList.add("column");
    labelDiv2.innerHTML = "Strategy " + strategy;
    labelDiv2.style.flex = "4";
    labelDiv2.style.fontSize = "1.0em";

    var labelDiv3 = document.createElement("DIV");
    labelDiv3.classList.add("column");
    labelDiv3.innerHTML = task;
    labelDiv3.style.flex = "4";
    labelDiv3.style.fontSize = "1.0em";

    var buttonDiv1 = document.createElement("DIV");
    buttonDiv1.classList.add("column");
    buttonDiv1.style.flex = "3"; 

    var button1 = document.createElement("BUTTON");
    button1.innerHTML = undoButton;
    buttonDiv1.appendChild(button1);

    button1.addEventListener("click", function() {
        sendNewTask(CONTROLLED_ROBOT, task, "taskLabel", "noSelection", strategySelected);         
    });

    outerDiv.appendChild(labelDiv1);
    outerDiv.appendChild(labelDiv2);
    outerDiv.appendChild(labelDiv3);
    outerDiv.appendChild(buttonDiv1);

    tab.appendChild(outerDiv);
}



function enableClient()
{
    CLIENT_ENABLED = true;
    document.getElementById("body").style.visibility = "visible";
    
    var canvasContainer = document.getElementById( "canvas-container" );
    canvasContainer.style.backgroundColor = canvasContainerBackgroundColor
    canvas = document.getElementById( "field-canvas" );
    canvas.width = CANVAS_FIELD_WIDTH;
    canvas.height = CANVAS_FIELD_HEIGHT;
    canvas.unscaledMousePositionOnCanvas = [canvas.width/2, canvas.height/2];
    canvas.scaledMousePositionOnCanvas = [canvas.width/2, canvas.height/2];

    canvas.addEventListener("mousemove", function(evt) 
    {   
        mouseOverCanvas = true;
        evt.target.unscaledMousePositionOnCanvas = viewportMouseToCanvasCoordinates(evt.target, evt.clientX, evt.clientY);
        evt.target.scaledMousePositionOnCanvas = scaleMousePositionToField(evt.target, evt.clientX, evt.clientY)
    });

    canvas.addEventListener("mouseleave", function(evt) 
    {   
        mouseOverCanvas = false;
    });

    
    canvas.addEventListener("mousedown", function(evt) 
    {   
        //console.log("click")
        var clickPos = scaleMousePositionToField(evt.target, evt.clientX, evt.clientY);
        if(evt.target.currentlySelectedTaskButton != undefined)
        {
            //Utils.assert(evt.target.CONTROLLED_ROBOT != undefined, "Inconsistent situation: not having a robot selected should make the task buttons unclickable");
            sendNewTask(CONTROLLED_ROBOT, evt.target.currentlySelectedTaskButton.taskType, evt.target.currentlySelectedTaskButton.taskLabel, evt.target.currentlySelectedTaskButton.selectionMode, strategySelected, clickPos[0], clickPos[1]);         
            toggleButton(evt.target.currentlySelectedTaskButton);
            evt.target.currentlySelectedTaskButton = undefined;
        }
    });

    canvas.currentlySelectedTaskButton = undefined;
    canvas.currentlySelectedStrategyButton = undefined;


    //TASK SENZA SELEZIONE DELLA POSIZIONE NEL CAMPO
    createTaskAssignmentButton("tasks-tab", "Go to ball and dribble", "GoToBallAndDribble", "noSelection")
    createTaskAssignmentButton("tasks-tab", "Pass the ball", "PassTheBall", "noSelection")
    createTaskAssignmentButton("tasks-tab", "Ask for the ball", "AskForBall", "noSelection")
    createTaskAssignmentButton("tasks-tab", "Spazza", "Spazza", "noSelection")
    createTaskAssignmentButton("tasks-tab", "Search the ball", "SearchBall", "noSelection")
        
    //TASK CON SELEZIONE DELLA POSIZIONE NEL CAMPO
    createTaskAssignmentButton("tasks-tab2", "Dribble", "Dribble", "selection")
    createTaskAssignmentButton("tasks-tab2", "Kick", "KickTheBall", "selection")
    createTaskAssignmentButton("tasks-tab2", "Go to position", "GoToPosition", "selection")
    createTaskAssignmentButton("tasks-tab2", "Look the ball", "LookTheBall", "selection")
    createTaskAssignmentButton("tasks-tab2", "Turn", "Turn", "selection")
    
    //STOP BUTTON
    createTaskAssignmentButton("tasks-tab3", "Stop", "Stop", "noSelection")
    
    //LOOK LEFT AND RIGHT
    createTaskAssignmentButton("tasks-tab4", "Look left", "LookLeft", "noSelection")
    createTaskAssignmentButton("tasks-tab4", "Look right", "LookRight", "noSelection")
    
    //STRATEGY BUTTON
    createStrategyAssignmentButton("tasks-tab5", "Strategy 1", 1, "noSelection")
    createStrategyAssignmentButton("tasks-tab5", "Strategy 2", 2, "noSelection")
    createStrategyAssignmentButton("tasks-tab5", "Strategy 3", 3, "noSelection")
    createStrategyAssignmentButton("tasks-tab5", "Strategy 4", 4, "noSelection")

}

var KEEPALIVE_SEND_INTERVAL = 5000;
var KEEPALIVE_RECEIVE_INTERVAL = 5000;
var CLIENT_INFO_INTERVAL = 1000;
var RETRY_CONNECTION_TIMEOUT = 2000;

var currentSocket;

var keepalive_receive_timeout;
var keepalive_send_timeout;

function checkSocketStillOpen()
{
    if(currentSocket == undefined || currentSocket.readyState == WebSocket.CLOSED || currentSocket.readyState == WebSocket.CLOSING)
    {
        return false;
    }
    return true;
}

function requestKeepalive() {
    
    if(!CLIENT_ENABLED)
    {
        clearInterval(keepalive_send_timeout);
        clearInterval(keepalive_receive_timeout);
    }

    if(!checkSocketStillOpen())
    {
        disableClient("Socket CLOSED");
        return;
    }

    //console.log("Requesting keepalive")
    currentSocket.send(generateHeader() + 'uthere?');
    //Set a timeout to be cleared in case a keepalive is received
    keepalive_receive_timeout = setTimeout(function () {
        //If this is executed, the server failed to respond to the keepalive
        disableClient("Keepalive not received");
    }, KEEPALIVE_RECEIVE_INTERVAL);
}

function sendClientInfo()
{
    currentSocket.send(generateHeader())
}

function setupSocket(webSocket)
{
    webSocket.onopen = function () {
        // connection is opened and ready to use
        
        currentSocket = webSocket;

        //console.log("WebSocket connected to NodeJS server")
        //console.log(webSocket)
        sendClientInfo(webSocket);

        //Start rendering the canvas
        enableClient();

        //Set up a ping pong method for keepalive
        //console.log("Setting up keepalive")
        keepalive_send_timeout = setInterval(requestKeepalive, KEEPALIVE_SEND_INTERVAL);

        startRenderingLoop();
    };

    webSocket.onerror = function (error) {
        // an error occurred when sending/receiving data
    };

    function resetTaskList()
    {
        currentTaskList = [];
        currentTaskPreviews = [];
    }

    function updateTimeLabel(time) {
        var timeLabel = document.getElementById("time-label");
        timeLabel.textContent = "Time Left: " + time;
    }

    function updateScoreLabel(score) {
        var scoreLabel = document.getElementById("score-label");
        scoreLabel.textContent = "Score: " + score;
    }

    function updatePacketsLabel(packets) {
        var packetsLabel = document.getElementById("packets-left-label");
        packetsLabel.textContent = "Packets Left: " + packets;
    }

    function addTask(taskType, taskID, parameters = undefined)
    {
        createTaskPreview(taskType, taskID, parameters)
        if(parameters == undefined)
        {
            currentTaskList.push({taskType : taskType, taskID : taskID})
        }
        else
        {
            currentTaskList.push({taskType : taskType, taskID : taskID, parameters : parameters})
        }
    }

    webSocket.onmessage = function (message) {
        // handle incoming message
        //console.log(message)
        //Avoid reading your own messages
        if(message.data.startsWith("TOSERVER")) return;
        
        var message_content = message.data.toString().split("!")[1]
        //console.log(message_content)

        if(message_content == 'yeah')
        {
            //Keepalive received, stop waiting
            //console.log("Keepalive received!")
            clearTimeout(keepalive_receive_timeout);
        }
        else if(message_content.startsWith('robotNotResponding'))
        {
            console.log("Robot not responding. Disabling client!")
            disableClient("Robot not responding")
        }
        else
        {
            if(!CLIENT_ENABLED)
            {
                enableClient()
                startRenderingLoop()
            }

            if(message_content.startsWith("timeleft")) {
                tempoRimanente =  message_content.split(":")[1]
                updateTimeLabel(tempoRimanente);
            }

            if(message_content.startsWith("score")) {
                score =  message_content.split(":")[1]
                updateScoreLabel(score);
            }

            if(message_content.startsWith("packets-left")) {
                packets_left =  message_content.split(":")[1]
                updatePacketsLabel(packets_left);
            }
            
            if(message_content.startsWith("robotAutonomousAndControlled"))
            {
                var message_fields = message_content.split(":")[1].split(";")
                for (var field of message_fields) {
                    var obsCoords = field.split(",")
                    robotNumber = parseInt(obsCoords[0]);

                    robotNumbersToPositions[robotNumber] = [
                        parseFloat(obsCoords[1]), 
                        Math.floor(parseFloat(obsCoords[2])), 
                        -Math.floor(parseFloat(obsCoords[3]))
                    ];
                }
               
            }
            
            else if(message_content.startsWith("ballPosition"))
            {
                message_content = message_content.split(":")[1]
                var message_fields = message_content.split(",")

                //NOTICE: the y coordinate is inverted
                ballPosition = [Math.floor(parseFloat(message_fields[0])), -Math.floor(parseFloat(message_fields[1]))]
            }
            else if(message_content.startsWith("obstacles"))
            {
                var message_fields = message_content.split(":")[1].split(";")
                obstaclesPositions = []
                for(var field of message_fields)
                {
                    var obsCoords = field.split(",")
                    
                    //NOTICE: the y coordinate is inverted
                    obstaclesPositions.push([Math.floor(parseFloat(obsCoords[0])), -Math.floor(parseFloat(obsCoords[1]))])
                }              
            }
            else if(message_content.startsWith("lastReceivedTask")) {
                lastReceivedTaskID += 1
                message_content = message_content.split(":")[1]
                var message_fields = message_content.split(",")
                createTableTask("taskCanvas", message_fields[0], strategySelected, message_fields[1], "undo")
            }    
        }
    };
}

//Taken from https://stackoverflow.com/questions/13546424/how-to-wait-for-a-websockets-readystate-to-change
function waitForWebSocketConnection(webSocket)
{
    setTimeout(
        function () {
            if (webSocket.readyState == WebSocket.OPEN) {
            } else {
                console.log("Attempting connection of websocket...")
                webSocket = new WebSocket("ws://"+SERVER_IP+":4000");
                setupSocket(webSocket)
                waitForWebSocketConnection(webSocket);
            }

        }, RETRY_CONNECTION_TIMEOUT); // wait 5 milisecond for the connection...
}


var CLIENT_ENABLED = true;
disableClient("Waiting for socket connection");
var webSocket = new WebSocket("ws://localhost:4000");
setupSocket(webSocket)
waitForWebSocketConnection(webSocket);
