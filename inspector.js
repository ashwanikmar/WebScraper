var forLoopElements = [];
var highlightedElements = [];
document.addEventListener(
  "mousemove",
  function (e) {
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
        highlightedElements.push(el);
      }
    }
  },
  true
);

/**
 * Calculating similarity score multiple factor like class, child count and name.
 * we can enhance this logic to get more accurate results. currently it will fail
 * if someone have extra class like active.
 * @param {*} firstElement
 * @param {*} secondElement
 * @returns Matching score
 */
function similarElementPredictionScore(firstElement, secondElement) {
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
}

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
