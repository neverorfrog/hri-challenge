var SERVER_IP = '127.0.0.1';
console.log(SERVER_IP);
"use strict";

if(typeof console === "undefined"){
    console = {};
}

var AUTONOMOUS_ROBOT = 1
var CONTROLLED_ROBOT = 2
var OPPONENT = 3

var strategySelected = 0

var tempoRimanente = undefined
var canvas;
var gl;

var showMesh, showNormals, showContours, showLightPosition, showTexture;


var DEFAULT_CANVAS_FIELD_WIDTH = 6000;
var DEFAULT_CANVAS_FIELD_HEIGHT = 9000;

var BORDER_STRIP_WIDTH = 700;

var CURRENT_CANVAS_FIELD_WIDTH = DEFAULT_CANVAS_FIELD_WIDTH + 2*BORDER_STRIP_WIDTH; 
var CURRENT_CANVAS_FIELD_HEIGHT = DEFAULT_CANVAS_FIELD_HEIGHT + 2*BORDER_STRIP_WIDTH;

var CURRENT_FIELD_WIDTH = CURRENT_CANVAS_FIELD_WIDTH;
var CURRENT_FIELD_HEIGHT = CURRENT_CANVAS_FIELD_HEIGHT;

var CANVAS_RESOLUTION_FACTOR = 0.4;

var CANVAS_FIELD_WIDTH = Math.floor(CURRENT_CANVAS_FIELD_WIDTH * CANVAS_RESOLUTION_FACTOR);
var CANVAS_FIELD_HEIGHT = Math.floor(CURRENT_CANVAS_FIELD_HEIGHT * CANVAS_RESOLUTION_FACTOR);

var FIELD_WIDTH = Math.floor(CURRENT_FIELD_WIDTH * CANVAS_RESOLUTION_FACTOR);
var FIELD_HEIGHT = Math.floor(CURRENT_FIELD_HEIGHT * CANVAS_RESOLUTION_FACTOR);

function mapValueToCurrentField(value) {
    return Utils.mapValue(value, 0, DEFAULT_CANVAS_FIELD_HEIGHT, 0, DEFAULT_CANVAS_FIELD_HEIGHT);
}

function mapValueToCurrentCanvas(value) {
    return Utils.mapValue(value, 0, CANVAS_FIELD_HEIGHT, 0, CURRENT_CANVAS_FIELD_HEIGHT);
}

var FieldDimensions = {
    FIELD_LINES_WIDTH: mapValueToCurrentCanvas(mapValueToCurrentField(50)),

    CENTER_CIRCLE_RADIUS: mapValueToCurrentCanvas(mapValueToCurrentField(750)),
    CENTER_DOT_RADIUS: mapValueToCurrentCanvas(mapValueToCurrentField(50)),

    Y_POS_SIDE_LINE: mapValueToCurrentCanvas(mapValueToCurrentField(4500)),
    X_POS_SIDE_LINE: mapValueToCurrentCanvas(mapValueToCurrentField(3000)),

    PENALTY_AREA_WIDTH: mapValueToCurrentCanvas(mapValueToCurrentField(4000)),
    PENALTY_AREA_HEIGHT: mapValueToCurrentCanvas(mapValueToCurrentField(1650)),

    PENALTY_MARK_DISTANCE: mapValueToCurrentCanvas(mapValueToCurrentField(1300)),

    SMALL_PENALTY_AREA_WIDTH: mapValueToCurrentCanvas(mapValueToCurrentField(2200)),
    SMALL_PENALTY_AREA_HEIGHT: mapValueToCurrentCanvas(mapValueToCurrentField(600)),

    GOAL_POST_RADIUS: mapValueToCurrentCanvas(mapValueToCurrentField(50)),
    GOAL_POST_WIDTH: mapValueToCurrentCanvas(mapValueToCurrentField(1500)),
    GOAL_POST_HEIGHT: mapValueToCurrentCanvas(mapValueToCurrentField(500)),

    TARGET_RADIUS: mapValueToCurrentCanvas(mapValueToCurrentField(150)),
    BALL_RADIUS: mapValueToCurrentCanvas(mapValueToCurrentField(120)),
    ROBOT_RADIUS: mapValueToCurrentCanvas(mapValueToCurrentField(200)),
    OBSTACLE_RADIUS: mapValueToCurrentCanvas(mapValueToCurrentField(200)),
};

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

    drawCircle(ctx, 0, -FieldDimensions.Y_POS_SIDE_LINE+FieldDimensions.PENALTY_MARK_DISTANCE, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    
    drawCircle(ctx, 0, FieldDimensions.Y_POS_SIDE_LINE-FieldDimensions.PENALTY_MARK_DISTANCE, FieldDimensions.GOAL_POST_RADIUS, "#FFFFFF", "FFFFFF", 5, [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
        
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

    var scaledMouseXOnCanvas = -Math.round(Utils.mapValue(mouseYOnCanvas, -Math.floor(CURRENT_CANVAS_FIELD_HEIGHT/2), Math.floor(CURRENT_CANVAS_FIELD_HEIGHT/2), 0, canvas.height));
    var scaledMouseYOnCanvas = Math.round(Utils.mapValue(mouseXOnCanvas, -Math.floor(CURRENT_CANVAS_FIELD_WIDTH/2), Math.floor(CURRENT_CANVAS_FIELD_WIDTH/2), 0, canvas.width));

    return [scaledMouseXOnCanvas, scaledMouseYOnCanvas]
}

function viewportMouseToCanvasCoordinates(canvas, xPos, yPos)
{
    var boundingRect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / boundingRect.width;    
    var scaleY = canvas.height / boundingRect.height;  
    return [(xPos - boundingRect.left) * scaleX, (yPos - boundingRect.top) * scaleY];
}

function transformCoordinates(x_pos, y_pos) {
    var x_pos_robocup_field = -y_pos;
    var y_pos_robocup_field = -x_pos;
    return {
        x_pos_robocup_field: x_pos_robocup_field,
        y_pos_robocup_field: y_pos_robocup_field
    };
}

function drawRobot(ctx, robotNumber, angle, xPos, yPos, isActiveRobot = false, isActiveTeammateRobot = false) {
    var fillColor = "#AAAAAA";
    var lineColor = "#000000";

    if (isActiveRobot || isActiveTeammateRobot) {
        fillColor = "#00FF00";
        lineColor = "#0000FF";
    }

    drawCircle(ctx, xPos, yPos, FieldDimensions.ROBOT_RADIUS, fillColor, lineColor, 
                mapValueToCurrentCanvas(mapValueToCurrentField(20)), //border width 
                [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);

    
    var labelRobot = robotNumber == CONTROLLED_ROBOT ? "Controlled" : "Autonomous";

    drawTextLabel(ctx, 
                    xPos + FieldDimensions.ROBOT_RADIUS*0.25 , 
                    yPos - FieldDimensions.ROBOT_RADIUS * 1.5, labelRobot, "#0000FF", 120,
                    [CANVAS_FIELD_WIDTH/2, CANVAS_FIELD_HEIGHT/2]);
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
        ctx.font = mapValueToCurrentCanvas(mapValueToCurrentField(180)) + "px Arial";
        
        // Aumentiamo il valore di x per spostare il testo a destra
        var xCoord = mapValueToCurrentCanvas(mapValueToCurrentField(800));  // Aggiungiamo 50 unità
        
        ctx.fillText("X: " + scaledTarget[0] + ", Y: " + -scaledTarget[1], 
                     xCoord,
                     mapValueToCurrentCanvas(mapValueToCurrentField(300)));
    }
    
    console.log("Drawing target preview: "+unscaledTarget)
    drawTargetOnField(canvas, unscaledTarget[0], unscaledTarget[1], targetColor)
}

function 
drawObstacles(ctx)
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
            mapValueToCurrentCanvas(mapValueToCurrentField(obs[0])) + FieldDimensions.ROBOT_RADIUS*0.25, 
            mapValueToCurrentCanvas(mapValueToCurrentField(obs[1])) + FieldDimensions.ROBOT_RADIUS * 2, "Obstacle", "#FF0000", 110,
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
    return "TOSERVER!clientID,"+CLIENT_ID+";robotNumber,"+CONTROLLED_ROBOT+";robotTeammateNumber,"+AUTONOMOUS_ROBOT+"|";
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

function createTaskAssignmentButton(tab, taskLabel, taskType, selectionMode, consecutive_button, taskLabel1, taskType1) {
    var outerDiv = createContainer("18%");
    var middleDiv = createContainer("80%");
    outerDiv.appendChild(middleDiv);
    
    if (consecutive_button) {
        middleDiv.style.display = "flex"; // Set middleDiv as flex container
        middleDiv.style.justifyContent = "space-around"; // Distribute space around items
        var innerDiv1 = createContainer("100%", "48%"); // Adjust width for each inner div
        var innerDiv2 = createContainer("100%", "48%");
        middleDiv.appendChild(innerDiv1);
        middleDiv.appendChild(innerDiv2);

        var btn1 = createButton(taskLabel , taskType, selectionMode);
        var btn2 = createButton(taskLabel1, taskType1, selectionMode);
        innerDiv1.appendChild(btn1);
        innerDiv2.appendChild(btn2);
    } else {
        var innerDiv = createContainer("100%", "100%");
        innerDiv.style.justifyContent = "space-around";
        middleDiv.appendChild(innerDiv);
        
        var btn = createButton(taskLabel, taskType, selectionMode);
        innerDiv.appendChild(btn);
    }

    var tasksTab = document.getElementById(tab);
    tasksTab.appendChild(outerDiv);               
}

function createContainer(height, width = "100%") {
    var div = document.createElement("DIV");
    div.classList.add("settings-horizontal-container");
    div.style.height = height;
    div.style.width = width;
    return div;
}

function createButton(taskLabel, taskType, selectionMode) {
    var btn = document.createElement("BUTTON");
    btn.classList.add("settings-horizontal-container");
    btn.innerHTML = taskLabel;
    btn.taskLabel = taskLabel;
    btn.taskType = taskType;
    btn.selectionMode = selectionMode;

    btn.onmousedown = function(e) {
        var canvas = document.getElementById("field-canvas");

        // Check if the clicked button is the currently selected one
        if (canvas.currentlySelectedTaskButton === btn) {
            toggleButton(btn);
            toggleTaskButtonSelection(btn);
            return;
        }

        // Unselect the other selected task button if there is one
        if (canvas.currentlySelectedTaskButton !== undefined) {
            toggleButton(canvas.currentlySelectedTaskButton);
            toggleTaskButtonSelection(canvas.currentlySelectedTaskButton);
        }

        if (selectionMode === "noSelection") {
            toggleButton(e.target);
            setTimeout(function () {
                toggleButton(e.target);
            }, 200);
            sendNewTask(CONTROLLED_ROBOT, btn.taskType, taskLabel, "noSelection", strategySelected);               
        } else {
            toggleButton(e.target);
            toggleTaskButtonSelection(e.target);
        }
    };

    return btn;
}

function createStrategyButton(label, strategyNumber, selectionMode) {
    var btn = document.createElement("BUTTON");
    btn.classList.add("settings-horizontal-container");
    btn.innerHTML = label;
    btn.strategyNumber = strategyNumber;
    btn.selectionMode = selectionMode;

    btn.onmousedown = function(e) {
        var canvas = document.getElementById("field-canvas"); // Ensure the canvas is defined

        if (canvas.currentlySelectedStrategyButton === e.target) {
            // If the currently selected button is the same as the clicked button, deselect it
            toggleButton(e.target);
            canvas.currentlySelectedStrategyButton = undefined;
            strategySelected = 0;
        } else {
            if (canvas.currentlySelectedStrategyButton != undefined) {
                // Deselect the previously selected button
                toggleButton(canvas.currentlySelectedStrategyButton);
            }
            // Select the new button
            strategySelected = strategyNumber;
            toggleButton(e.target);
            // Update the currently selected button
            canvas.currentlySelectedStrategyButton = e.target;
        }
    };

    return btn;
}

function createStrategyAssignmentButton(tab, strategyLabel, strategyNumber, selectionMode) {
    var outerDiv = createContainer("18%");
    var middleDiv = createContainer("80%");
    outerDiv.appendChild(middleDiv);

    var innerDiv = createContainer("100%");
    innerDiv.style.justifyContent = "space-around";
    middleDiv.appendChild(innerDiv);

    var btn = createStrategyButton(strategyLabel, strategyNumber, selectionMode);
    innerDiv.appendChild(btn);

    var tasksTab = document.getElementById(tab);
    tasksTab.appendChild(outerDiv);
}

var currentTaskList = [];
var lastReceivedTaskID = 0;
function createTableTask(tabId, id, taskID, strategy, task, undoButton) {
    var tab = document.getElementById(tabId);

    var outerDiv = document.createElement("DIV");
    outerDiv.classList.add("row-container");
    outerDiv.style.display = "flex";
    outerDiv.style.justifyContent = "space-between";
    outerDiv.style.alignItems = "center";
    outerDiv.style.width = "100%";
    outerDiv.style.paddingTop = "5%";
    outerDiv.style.padding = "1vw";
    outerDiv.style.border = "3px solid #ccc";
    outerDiv.style.marginBottom = "1vw"; // Controlla questo valore

    var containerDiv1 = document.createElement("DIV");
    containerDiv1.classList.add("column-container");
    containerDiv1.style.flex = "1";
    containerDiv1.style.padding = "5px";
    containerDiv1.style.borderRight = "1px solid #ddd";
    var labelDiv1 = document.createElement("DIV");
    labelDiv1.innerHTML = id;
    labelDiv1.style.fontSize = "1.0vw";
    labelDiv1.style.color = "#333";
    containerDiv1.appendChild(labelDiv1);

    var containerDiv2 = document.createElement("DIV");
    containerDiv2.classList.add("column-container");
    containerDiv2.style.flex = "4";
    containerDiv2.style.padding = "5px";
    containerDiv2.style.borderRight = "1px solid #ddd";
    var labelDiv2 = document.createElement("DIV");
    labelDiv2.innerHTML = "Strategy " + strategy;
    labelDiv2.style.fontSize = "1.0vw";
    labelDiv2.style.color = "#333";
    containerDiv2.appendChild(labelDiv2);

    var containerDiv3 = document.createElement("DIV");
    containerDiv3.classList.add("column-container");
    containerDiv3.style.flex = "4";
    containerDiv3.style.padding = "5px";
    containerDiv3.style.maxWidth = "calc(60% - 10px)";
    containerDiv3.style.overflow = "hidden";
    var labelDiv3 = document.createElement("DIV");
    labelDiv3.innerHTML = task;
    labelDiv3.style.fontSize = "1.0vw";
    labelDiv3.style.color = "#333";
    containerDiv3.appendChild(labelDiv3);

    var buttonDiv1 = document.createElement("DIV");
    buttonDiv1.classList.add("column-container");
    buttonDiv1.style.flex = "3";
    buttonDiv1.style.display = "flex";
    buttonDiv1.style.justifyContent = "center";
    buttonDiv1.style.alignItems = "center";
    buttonDiv1.style.padding = "5px";
    
    var button1 = document.createElement("BUTTON");
    button1.innerHTML = undoButton;
    button1.classList.add("undo-button");
    buttonDiv1.appendChild(button1);

    button1.addEventListener("click", function() {
        removeTask(taskID);
        updateTaskTable(tabId);
    });

    outerDiv.appendChild(containerDiv1);
    outerDiv.appendChild(containerDiv2);
    outerDiv.appendChild(containerDiv3);
    outerDiv.appendChild(buttonDiv1);

    tab.appendChild(outerDiv);
}




function updateTaskTable(tabId) {
    var tab = document.getElementById(tabId);
    tab.innerHTML = ''; 

    currentTaskList.forEach((task, index) => {
        createTableTask(tabId, index+1, task.taskID, task.strategy, task.taskLabel, 'Undo');
    });
}

function removeTask(taskID) {
    currentTaskList = currentTaskList.filter(task => task.taskID !== taskID);
    sendToWebSocket("Undo:"+taskID);
}

function addTask(taskType, strategy, ciao, taskDescription) {
    var newTask = {
        id: currentTaskList.length + 1,
        taskID: lastReceivedTaskID,
        strategy: strategy,
        taskType: taskType,
        taskDescription: taskDescription
    };
    currentTaskList.push(newTask);
    updateTaskTable('taskCanvas');
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
    
    //LOOK LEFT AND RIGHT SCAN
    createTaskAssignmentButton("tasks-tab4", "Look left", "LookLeft", "noSelection", true, "Look right", "LookRight")
    createTaskAssignmentButton("tasks-tab4", "Scan", "Scan", "noSelection", false)
    

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

    function addTask(taskType, taskID, strategy, taskLabel, parameters = undefined)
    {
        if(parameters == undefined)
        {
            currentTaskList.push({taskType : taskType, taskID : taskID, strategy : strategy, taskLabel : taskLabel})
        }
        else
        {
            currentTaskList.push({taskType : taskType, taskID : taskID, strategy : strategy, taskLabel : taskLabel, parameters : parameters})
        }
        updateTaskTable('taskCanvas');
    }

    function switchMessageContent(message_content) {

        if(message_content.startsWith("timeLeft")) {
            tempoRimanente =  message_content.split(":")[1]
            updateTimeLabel(tempoRimanente);
        }
    
        if(message_content.startsWith("score")) {
            score =  message_content.split(":")[1]
            updateScoreLabel(score);
        }
    
        if(message_content.startsWith("packetsLeft")) {
            packets_left =  message_content.split(":")[1]
            updatePacketsLabel(packets_left);
        }
    
        if(message_content.startsWith("robotPos")) {
            var field = message_content.split(":")[1]
            obsCoords = field.split(",")
            robotNumber = parseInt(obsCoords[0]);
            var transformedCoordinates = transformCoordinates(obsCoords[2], obsCoords[3]);
            var xPos = transformedCoordinates.x_pos_robocup_field;
            var yPos = transformedCoordinates.y_pos_robocup_field;
            robotNumbersToPositions[robotNumber] = [
                parseFloat(obsCoords[1]), 
                Math.floor(parseFloat(xPos)), 
                Math.floor(parseFloat(yPos))
            ];
        }
    
        if(message_content.startsWith("ballPos")) {
            message_content = message_content.split(":")[1]
            var message_fields = message_content.split(",")
            var transformedCoordinates = transformCoordinates(message_fields[0], message_fields[1]);
            var xPos = transformedCoordinates.x_pos_robocup_field;
            var yPos = transformedCoordinates.y_pos_robocup_field;
            ballPosition = [Math.floor(parseFloat(xPos)), Math.floor(parseFloat(yPos))]
        }
    
        if(message_content.startsWith("obstacles")){
            var message_fields = message_content.split(":")[1].split(";")
            obstaclesPositions = []
            for(var field of message_fields)
            {
                var obsCoords = field.split(",")
                var transformedCoordinates = transformCoordinates(obsCoords[0], obsCoords[1]);
                var xPos = transformedCoordinates.x_pos_robocup_field;
                var yPos = transformedCoordinates.y_pos_robocup_field;    
                //NOTICE: the y coordinate is inverted
                obstaclesPositions.push([Math.floor(parseFloat(xPos)), Math.floor(parseFloat(yPos))])
            }              
        }
    
        if(message_content.startsWith("lastReceivedTask")) {
            lastReceivedTaskID += 1
            message_content = message_content.split(":")[1]
            var message_fields = message_content.split(",")
            addTask(message_fields[1], message_fields[0], message_fields[2])
            //createTableTask("taskCanvas", message_fields[0], strategySelected, message_fields[1], "undo")
        } 
    }
    
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

            switchMessageContent(message_content);
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