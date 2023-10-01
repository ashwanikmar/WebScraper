var forLoopElements = [];
var highlightedElements = [];
var highlightedButtonElements = [];
var isListeningForLoopMousemove = false;
var isListeningButtonSelectMousemove = false;

var clickButtonElements = [];

forLoopInspectionStart = (e) => {
  let target = e.target;

  /**
   * Step 1. We are selecting previous element and then next element.
   * and matching with the target.
   */
  let el = target;
  let loopElements = [el];

  while (similarElementPredictionScore(el, el.previousElementSibling) > 80) {
    el = el.previousElementSibling;
    loopElements.unshift(el);
  }

  el = target;
  while (similarElementPredictionScore(el, el.nextElementSibling) > 80) {
    el = el.nextElementSibling;
    loopElements.push(el);
  }

  /**
   * Step 2. If we have more than 1 element having similar property then it
   * means that it's a loop.
   */
  if (loopElements.length > 1) {
    forLoopElements = loopElements;
  }

  /**
   * When user goes inside the loop, then I am highlighting similar element
   * by finding its path and setting its outline on all forLoop element
   */
  let forLoopToTargetElementPath = findDepthOfTargetElement(
    target,
    forLoopElements
  );

  // Before highlighting new element I am removing the outline from the old once
  for (let index = 0; index < highlightedElements.length; index++) {
    highlightedElements[index].style.outline = "none";
  }
  highlightedElements = [];

  for (let index = 0; index < forLoopElements.length; index++) {
    let el = forLoopElements[index];
    let isElementFound = true;

    for (let index = 0; index < forLoopToTargetElementPath.length; index++) {
      if (el.children[forLoopToTargetElementPath[index]] == undefined) {
        isElementFound = false;
        break;
      }
      el = el.children[forLoopToTargetElementPath[index]];
    }

    if (isElementFound) {
      el.style.outline = "dashed";
      el.style.outlineColor = "black";
      highlightedElements.push(el);
    }
  }
};

forLoopInspectionStop = (e) => {
  document.removeEventListener("mousemove", forLoopInspectionStart, true);
  document.removeEventListener("click", forLoopInspectionStop);
  isListeningForLoopMousemove = false;
};

selectClickButtonStart = (e) => {
  e.stopPropagation();
  e.preventDefault();
  let target = e.target;

  let forLoopToTargetElementPath = findDepthOfTargetElement(
    target,
    forLoopElements
  );

  // Before highlighting new element I am removing the outline from the old once
  for (let index = 0; index < highlightedButtonElements.length; index++) {
    highlightedButtonElements[index].style.outline = "none";
  }
  highlightedButtonElements = [];

  for (let index = 0; index < forLoopElements.length; index++) {
    let el = forLoopElements[index];
    let isElementFound = true;

    for (let index = 0; index < forLoopToTargetElementPath.length; index++) {
      if (el.children[forLoopToTargetElementPath[index]] == undefined) {
        isElementFound = false;
        break;
      }
      el = el.children[forLoopToTargetElementPath[index]];
    }

    if (isElementFound) {
      el.style.outline = "dashed";
      el.style.outlineColor = "blue";
      highlightedButtonElements.push(el);
    }
  }
};

selectClickButtonStop = (e) => {
  e.stopPropagation();
  e.preventDefault();
  let target = e.target;
  document.removeEventListener("mousemove", selectClickButtonStart, true);
  document.removeEventListener("click", selectClickButtonStop, true);
  isListeningButtonSelectMousemove = false;
  clickButtonElements.push(target);
  document.getElementById("action_count").innerText =
    clickButtonElements.length;
};

runActions = () => {
  for (let index = 0; index < clickButtonElements.length; index++) {
    let forLoopToTargetElementPath = findDepthOfTargetElement(
      clickButtonElements[index],
      forLoopElements
    );

    for (let index = 0; index < forLoopElements.length; index++) {
      let el = forLoopElements[index];
      let isElementFound = true;

      for (let index = 0; index < forLoopToTargetElementPath.length; index++) {
        if (el.children[forLoopToTargetElementPath[index]] == undefined) {
          isElementFound = false;
          break;
        }
        el = el.children[forLoopToTargetElementPath[index]];
      }

      if (isElementFound) {
        el.click();
      }
    }
  }

  clickButtonElements = [];
  forLoopElements = [];
  highlightedElements = [];
  highlightedButtonElements = [];
  document.getElementById("action_count").innerText =
    clickButtonElements.length;
};

/**
 * Calculating similarity score multiple factor like class, child count and name.
 * we can enhance this logic to get more accurate results. currently it will fail
 * if someone have extra class like active.
 * @param {*} firstElement
 * @param {*} secondElement
 * @returns Matching score
 */
similarElementPredictionScore = (firstElement, secondElement) => {
  let score = 0;

  if (!firstElement || !secondElement) {
    return score;
  }

  if (firstElement.nodeName == secondElement.nodeName) {
    score += 40;
  }

  if (firstElement.childElementCount == secondElement.childElementCount) {
    score += 40;
  }

  if (
    Array.from(firstElement.classList).sort().join(",") ==
    Array.from(secondElement.classList).sort().join(",")
  ) {
    score += 20;
  }

  return score;
};

/**
 * Backtracing nested element to the loop
 * @param {*} targetElement
 * @param {*} forLoopElement
 * @returns Matching score
 */
findDepthOfTargetElement = (targetElement, forLoopElement) => {
  let el = targetElement;
  let isParentFoundInForLoopElement = false;
  let pathToTargetElement = [];

  if (!el.parentElement || forLoopElement.length < 2) {
    return pathToTargetElement;
  }

  while (!isParentFoundInForLoopElement) {
    for (let index = 0; index < forLoopElement.length; index++) {
      if (el.isEqualNode(forLoopElement[index])) {
        isParentFoundInForLoopElement = true;
      }
    }

    if (!isParentFoundInForLoopElement) {
      for (let index = 0; index < el.parentElement.children.length; index++) {
        if (el.isEqualNode(el.parentElement.children[index])) {
          pathToTargetElement.unshift(index);
        }
      }

      el = el.parentElement;

      if (el.nodeName == "HTML") {
        /**
         * Setting it to true even we don't find the parent, basically
         * breaking the while loop.
         */
        isParentFoundInForLoopElement = true;
        pathToTargetElement = [];
      }
    }
  }

  return pathToTargetElement;
};

initExtension = () => {
  let containerEle = document.createElement("div");
  containerEle.style.position = "fixed";
  containerEle.style.bottom = "0px";
  containerEle.style.left = "calc(50vw / 2)";
  containerEle.style.width = "50vw";
  containerEle.style.height = "100px";
  containerEle.style.zIndex = "100";
  containerEle.style.backgroundColor = "#1f1e24";
  containerEle.style.borderTopLeftRadius = "15px";
  containerEle.style.borderTopRightRadius = "15px";
  containerEle.style.display = "flex";
  containerEle.style.alignItems = "center";
  containerEle.style.justifyContent = "center";
  containerEle.style.fontFamily = "sans-serif";

  let loopButtonEle = document.createElement("div");
  loopButtonEle.innerText = "select loop";
  loopButtonEle.style.color = "white";
  loopButtonEle.style.backgroundColor = "#434248";
  loopButtonEle.style.height = "50%";
  loopButtonEle.style.width = "50%";
  loopButtonEle.style.border = "1px dashed white";
  loopButtonEle.style.borderRadius = "5px";
  loopButtonEle.style.display = "flex";
  loopButtonEle.style.justifyContent = "center";
  loopButtonEle.style.alignItems = "center";
  loopButtonEle.style.cursor = "pointer";

  loopButtonEle.onclick = (e) => {
    e.stopPropagation();

    if (!isListeningForLoopMousemove) {
      document.addEventListener("click", forLoopInspectionStop);
      document.addEventListener("mousemove", forLoopInspectionStart, true);
      actionContainer.style.display = "flex";
      loopButtonEle.style.display = "none";
      isListeningForLoopMousemove = true;
    }
  };

  let clickButtonAction = document.createElement("div");
  clickButtonAction.innerText = "select Click Button";
  clickButtonAction.style.color = "white";
  clickButtonAction.style.backgroundColor = "#434248";
  clickButtonAction.style.height = "50%";
  clickButtonAction.style.width = "25%";
  clickButtonAction.style.border = "1px dashed white";
  clickButtonAction.style.borderRadius = "5px";
  clickButtonAction.style.textAlign = "center";
  clickButtonAction.style.cursor = "pointer";

  clickButtonAction.onclick = (e) => {
    e.stopPropagation();
    if (!isListeningButtonSelectMousemove) {
      document.addEventListener("click", selectClickButtonStop, true);
      document.addEventListener("mousemove", selectClickButtonStart, true);
      isListeningButtonSelectMousemove = true;
    }
  };

  let runButtonAction = document.createElement("div");
  runButtonAction.innerText = "Run";
  runButtonAction.style.color = "white";
  runButtonAction.style.backgroundColor = "#6664ff";
  runButtonAction.style.height = "50%";
  runButtonAction.style.width = "25%";
  runButtonAction.style.border = "1px dashed white";
  runButtonAction.style.borderRadius = "5px";
  runButtonAction.style.textAlign = "center";
  runButtonAction.style.cursor = "pointer";
  runButtonAction.onclick = () => {
    actionContainer.style.display = "none";
    loopButtonEle.style.display = "flex";
    runActions();
  };

  let actionContainer = document.createElement("div");
  actionContainer.innerHTML = `<div> Add Action: <span id="action_count">0</span> </div>`;
  actionContainer.style.display = "none";
  actionContainer.style.width = "100%";
  actionContainer.style.justifyContent = "space-around";
  actionContainer.style.color = "white";

  actionContainer.appendChild(clickButtonAction);
  actionContainer.appendChild(runButtonAction);

  containerEle.appendChild(loopButtonEle);
  containerEle.appendChild(actionContainer);

  document.body.appendChild(containerEle);
};

initExtension();
