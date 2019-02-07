var frontend;
var backend;

var timeout;
var configuration = [];

function loadConfig() {
  const removeButton = document.getElementById('removeButton');
  removeButton.addEventListener("click", () => {
    let child = getFirstActiveListItem();
    if (child !== null) {
      let list = document.getElementById("currentBuildList");
      let imgId = child.id.substring(5);
      removeClassFromElement(document.getElementById(imgId), "selected");
      list.removeChild(child);
      if (list.childElementCount > 0){
        activateListItemById(list.children[list.childElementCount-1].id);
      }
      validateConfig();
    } 
  });

  fetch('/get/extensions')
    .then(data => {
      return data.json()
    })
    .then((response)=>{
      frontend = response["frontend"];
      backend = response["backend"];
      let front = response["frontend"];
      let back = response["backend"];
      /**
       * Update the coumn of frontend extensions.
       */
      updateColumn("fe-column", front);
      
      /**
       * Update the column for backend extensions.
       */
      updateColumn("be-column", back);
    });
}

function removeElementFromBuildList(element) {

}

function updateColumn(colName, extensions) {
  let column = document.getElementById(colName);
  let i;
  for (i = 0; i < extensions.length; i ++){
    let element = extensions[i];
    let name = element["name"];
    let img = document.createElement("img");
    img.classList.add('extension-img');
    img.id = name;
    img.src = element["imgUrl"];
    img.alt = "Missing Image";
    column.appendChild(img);
    // let required = element["requiredExtensions"];
    img.addEventListener("click", () => {
      if (img.classList.contains('selected')) {
        removeClassFromElement(img, "selected");
        removeListItem(name);
      } else {
        addClassToElement(img, "selected");
        addListItem(name);
      }
      validateConfig();
    });
    img.addEventListener("mouseover", () => {
      addClassToElement(img, "hovered");
      selectExtensionById(name);
      clearTimeout(timeout);
    });
    img.addEventListener("mouseout", () => {
      removeClassFromElement(img, "hovered");
      timeout = setTimeout(() => {selectExtensionById(null)}, 100);
    });
    getExtensionById(name);
  }
}

/**
 * Add one item to the currentBuildList and link it to the
 * corresponding image via id.
 * @param {String} id 
 */
function addListItem(id) {
  let list = document.getElementById("currentBuildList");
  deactivateActiveListItems();
  let item = document.createElement("a");
  item.id = "list-" + id;
  item.classList.add("list-group-item");
  let content = document.createElement("h4");
  content.textContent = id;
  content.classList.add("list-group-item-heading");
  item.appendChild(content);
  item.addEventListener("click", () => {
    if (!item.classList.contains("active")) {
      deactivateActiveListItems();
      activateListItemById("list-"+ id)
    }
  });
  list.appendChild(item);
  activateListItemById("list-"+ id);
}

/**
 * Add the "active" class to an element determined by id.
 * @param {String} id 
 */
function activateListItemById(id) {
  let item = document.getElementById(id);
  if (item !== null) {
    item.classList.add('active');
    if (item.parentElement === document.getElementById("currentBuildList")){
      selectExtensionById(id.substring(5));
    }
  }
}

/**
 * Updates the info-box with information about an extension defined by id.
 * @param {String} id 
 */
function selectExtensionById(id) {
  clearSelection();
  if (id !== null) {
    let extension = getExtensionById(id);
    if (extension !== null) {
      
      setInfoBoxHeading(extension["name"]);
      let body = document.getElementById("info-box-body");
      let descContent = document.createElement("p");
      let reqContent = document.createElement("p");
      let reqHead = document.createElement("h4");
      descContent.textContent = extension["desc"];
      body.appendChild(descContent);
      reqHead.textContent = "Requires:";
      body.appendChild(reqHead);
      reqContent.textContent = extension["requiredExtensions"].toString();
      body.appendChild(reqContent);
      if (extension["incompatibleExtensions"].length > 0) {
        let incHead = document.createElement("h4");
        incHead.textContent = "Incompatible with:";
        body.appendChild(incHead);
        let incContent = document.createElement("p");
        incContent.textContent = extension["incompatibleExtensions"].toString();
        body.appendChild(incContent);
      }
    }
  } else {
    let firstListItem = getFirstActiveListItem();
    if (firstListItem !== null) {
      selectExtensionById(firstListItem.id.substring(5));
    } else {
      setInfoBoxHeading("Please select an extension")
    }
  }
}

/**
 * Set the infoBoxHeading to heading.
 * @param {String} heading 
 */
function setInfoBoxHeading(heading){
  let header = document.getElementById("info-box-heading");
  let title = document.createElement("h3");
  let titleText = document.createElement("b");

  titleText.textContent = heading;
  title.appendChild(titleText);
  title.classList.add("panel-title");
  header.appendChild(title);
}

/**
 * Clears all content from the info-box.
 */
function clearSelection(){
  let heading = document.getElementById("info-box-heading");
  let body = document.getElementById("info-box-body");
  while (heading.firstChild) {
    heading.removeChild(heading.firstChild);
  }
  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }
}

/**
 * Remove one item by id from the currentBuildList.
 * @param {String} id 
 */
function removeListItem(id) {
  let list = document.getElementById("currentBuildList");
  if (list.hasChildNodes()) {
    child = document.getElementById("list-" + id);
    if (child.classList.contains("active") && list.childElementCount > 1){
      activateListItemById(list.children[list.childElementCount-2].id);
    }
    list.removeChild(child);
  }
}

/**
 * Remove the active tag from all list items in the currentBuildList.
 */
function deactivateActiveListItems() {
  let list = document.getElementById("currentBuildList");
  let child = getFirstActiveListItem();
  if (child !== null) {
    removeClassFromElement(child, "active");
  }
}

/**
 * Returns the first item from currentBuildList that has the class "active".
 */
function getFirstActiveListItem() {
  let list = document.getElementById("currentBuildList");
  let listItem = null;
  if (list.hasChildNodes) {
    for (let i = 0; i<list.childElementCount; i++) {
      let child = list.children[i];
      if (child.classList.contains("active")) {
        listItem = child;
        break;
      }
    }
  }
  return listItem; 
}

/**
 * Removes a class from an Element if present.
 * @param {Element} element 
 * @param {String} cl 
 */
function removeClassFromElement(element, cl) {
  if (element !== null && element.classList.contains(cl)){
    element.classList.remove(cl);
  }
}

/**
 * Adds a class to an Element if not present.
 * @param {Element} element 
 * @param {String} cl 
 */
function addClassToElement(element, cl) {
  if (element !== null && !element.classList.contains(cl)){
    element.classList.add(cl);
  }
}

/**
 * Search for an entry with id
 * @param {String} id 
 */
function getExtensionById(id){
  let extension = null;
  if (id.substring(0,7) === "backend") {
    for (let i = 0; i<backend.length; i++) {
      if (backend[i]["name"] === id) {
        extension = backend[i];
      }
    }
  } else if ((id.substring(0,8) === "frontend")) {
    for (let i = 0; i<frontend.length; i++) {
      if (frontend[i]["name"] === id) {
        extension = frontend[i];
      }
    }
  }
  return extension;
}

/**
 * Removes the required and incompatible classes from all extension-images.
 */
function removeValitdationMarks() {
  let images = document.getElementsByClassName("extension-img");
  for (let i = 0; i<images.length; i++) {
    removeClassFromElement(images[i], "required");
    removeClassFromElement(images[i], "incompatible");
  }
}

/**
 * Activate the continue button if inactive.
 */
function activateContinueButton() {
  let contButton = document.getElementById("contButton");
  if (contButton.classList.contains("btn-danger")) {
    contButton.href = "/confirmation";
    removeClassFromElement(contButton, "btn-danger");
    addClassToElement(contButton, "btn-success");
  }
}

/**
 * Deactivate the continue button if active.
 */
function deactivateContinueButton() {
  let contButton = document.getElementById("contButton");
  if (contButton.classList.contains("btn-success")){
    contButton.removeAttribute("href");
    removeClassFromElement(contButton, "btn-success");
    addClassToElement(contButton, "btn-danger");
  }
}

/**
 * Validates the current config by checking the requirements and incompatibilities
 * of all elements corresponding to the children of currentBuildList.
 */
function validateConfig(){
  removeValitdationMarks()
  const status = {
    wanted: [],
    required: [],
    incompatible: []
  };
  let list = document.getElementById("currentBuildList");
  if(list.childElementCount > 0){
    for (let i = 0; i < list.childElementCount; i++) {
      let childId = list.children[i].id.substring(5);
      let extensions = getExtensionById(childId);
      status.wanted.push(childId);
      extensions["requiredExtensions"].forEach(requiredExtension => {
        let element = document.getElementById(requiredExtension);
        if (!element.classList.contains("selected")) {
          addClassToElement(element, "required");
          if (status.required.indexOf(requiredExtension) === -1 ){
            status.required.push(requiredExtension);
          }
        }
      });
      extensions["incompatibleExtensions"].forEach(incompatibleExtension => {
        let element = document.getElementById(incompatibleExtension);
        if (element.classList.contains("selected")){
          addClassToElement(element, "incompatible");
          if (status.incompatible.indexOf(incompatibleExtension) === -1 ){
            status.incompatible.push({childId, incompatibleExtension});
          }
        }
      });
    }
  }
  if (status.wanted.length>0 
        && status.required.length === 0 
        && status.incompatible.length === 0) {
    configuration = status.wanted;
    activateContinueButton();
  } else {
    deactivateContinueButton();
  }
  console.log(status);
}