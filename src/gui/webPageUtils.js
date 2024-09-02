function toggleButton(targetButton) {
    if (targetButton.hasAttribute("noToggle")) return;

    // Toggle the "active" class
    if (targetButton.classList.contains("active")) {
        targetButton.classList.remove("active");
    } else {
        targetButton.classList.add("active");
    }
}

function toggleTaskButtonSelection(button) {
    var canvas = document.getElementById("field-canvas");

    if (canvas.currentlySelectedTaskButton === button) {
        // If the clicked button is already selected, unselect it
        canvas.currentlySelectedTaskButton = undefined;
        button.classList.remove("active");
        console.log("Task button " + button.id + " unselected");
    } else {
        // Otherwise, select the clicked button
        canvas.currentlySelectedTaskButton = button;
        button.classList.add("active");
        console.log("Task button " + button.id + " selected with mode " + button.selectionMode);
    }
}
