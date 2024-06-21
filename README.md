$$\color{Orange}{\texttt{\huge Luigi RoboCup Challenge}}$$

![Luigi](docs/images/luigi.png)

# Motion

## Robot motion

### High level control
- Tactics and strategies
  -  Characteristics: 
    -  triggered through buttons
    -  should send a packet to the autonomous robot 

### Mid level control
- Go to ball 
 - Skills: 
   - Walk to ball, 
   - Go to ball and pass, 
   - Go to ball and dribble,
   - Intecept the ball
 - Characteristics:
   - look at the ball unless are provided different commands for the head motion,
   - triggered through buttons 
- Go to point 
 - Skills: 
   - Go to point
 - Characteristics: 
   - look at point unless are provided different commands for the head motion,
   - triggered through clicking on the 2D field

### Low level control
- move the robot using WASD/arrows or the joypad (the robot should return on the original path when the command isn't provided anymore?)
- change the parameters of the path planner (e.g. increase/decrease the minimum distance to avoid obstacles, i.e. be more conservative/rough)
- increase/decrease the speed of the robot

## Head motion
The robot should always look forward or at the ball unless the human provides commands to move the head.
When the command is not provided anymore, the robot head should returns to the original position (look forward/look at the ball)
The commands can be provided using the arrows keys of the keyboard or the joypad and moving the head directly to a predefined angle (in pan/tilt), or moving incrementally it (e.g. 5° at time).



# Interface
On the screen must be present
- a 2D field showing:
    - the controlled robot
    - the teammate
    - the opponents
    - the line of the passage between the controlled robot and the teammate
    - the line that connect the teammate with the opponent goal
    - the path planner
- a set of buttons:
    - go to a point
    - go to ball
    - pass the ball
    - kick the ball on a point (and the point should be provided clicking on the 2D field)
    - dribble to reach a point (and the point should be provided clicking on the 2D field)
    - scan with the head (moving one time to left and one time to right, or moving the head left and right for X seconds)
    - search the ball
- the ball model
    - the ball is currently in the image of the controlled robot (active perception)
    - the ball is currently in the image of the teammate (is it possible?) (passive perception)
    - the ball model was updated X seconds ago (by the controlled robot/by the teammate/both ?)
- the obstacle model
    - how many obstacles are in the image of the controlled robot (active perception)
    - how many obstacles are in the image of the teammate (is it possible?) (passive perception)
    - the obstacle model was updated X seconds ago (by the controlled robot/by the teammate/both ?)
    All this stuff can be shown in two lists (one for each robot) on a part of the screen (since we know that there are exactly two opponents) or by coloring the opponents according to legend.
- the current time of the game and the points obtained so far (estimated?)
- The FOV of the robot displayed as a cone on the 2D field


# Normal vs Forced State
- **Normal state**: once an action is triggered the robot should perform that action until the completition. 
- **Forced state**: if the operator enters in _forced_ state, he can overwrite the current active action with a new action (e.g. the robot is doing Go to ball and Pass and the operator can force Go to ball and Dribble).

Go to ball and dribble can be always overwritten, also in normal state (because is the base action) (?)

TODO: define a key or a combination of keys to enter in the forced state. Some examples:
- _ctrl + f_ both to enter and exit to the forced state
- enter in the forced state with _f_ and keep the forced state until the key is pressed. Return in the normal state when the key is released. 
- ...


# Proposals
- Could be useful to plot the next X expected positions of the teammate in order to plan the passage in advance.
- Indentify which opponent robot is controlled and which is autonomous, in order to apply tactics. Idea: douring the attacking phase track the robot that kick to the own goal, while in the defense phase track the robot that is the goalkeeper.


# TODOs
- [ ] head motion
- [ ] low level robot motino
- [ ] mid level robot motion
- [ ] high level robot motion
- [ ] sketch of the interface
- [ ] attacking phase
- [ ] defending phase





