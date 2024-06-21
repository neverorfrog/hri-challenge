function toggleButton(targetButton){
    if(targetButton.hasAttribute("noToggle")) return;
    if(targetButton.className.includes("active"))
    {
        targetButton.className = targetButton.className.replace(" active", "")
    }
    else targetButton.className += " active";

    for (button of targetButton.parentElement.getElementsByTagName("button")) {
    if (button.id!=targetButton.id){
        button.className = tab_button.className.replace(" active", "");
    }
    }

    if(targetButton.innerHTML.includes(" ON"))
    {
        targetButton.innerHTML = targetButton.innerHTML.replace(" ON", " OFF")
    } else if(targetButton.innerHTML.includes(" OFF"))
    {
        targetButton.innerHTML = targetButton.innerHTML.replace(" OFF", " ON")
    }

    if(targetButton.innerHTML.includes("Pause"))
    {
        targetButton.innerHTML = targetButton.innerHTML.replace("Pause", "Resume")
    } else if(targetButton.innerHTML.includes("Resume"))
    {
        targetButton.innerHTML = targetButton.innerHTML.replace("Resume", "Pause")
    }
};


function toggleTaskButtonSelection(button) {

    var canvas = document.getElementById("field-canvas");
    if(canvas.currentlySelectedTaskButton == button)
    {
        
        canvas.currentlySelectedTaskButton = undefined;
        console.log("Task button "+button.id+" unselected")
    }
    else 
    {
        canvas.currentlySelectedTaskButton = button;
        
        console.log("Task button "+button.id+" selected with mode "+document.getElementById("field-canvas").currentlySelectedTaskButton.selectionMode);
    }
}

function toggleTaskButtonSelection(button) {

    var canvas = document.getElementById("field-canvas");
    if(canvas.currentlySelectedTaskButton == button)
    {
        
        canvas.currentlySelectedTaskButton = undefined;
        console.log("Task button "+button.id+" unselected")
    }
    else 
    {
        canvas.currentlySelectedTaskButton = button;
        
        console.log("Task button "+button.id+" selected with mode "+document.getElementById("field-canvas").currentlySelectedTaskButton.selectionMode);
    }
}
