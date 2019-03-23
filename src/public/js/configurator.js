var frontend;
var backend;

var timeout;

let build1 = ["frontend-extension-colorpicker", "frontend-extension-tutorial"];

loadConfigurator();

function loadConfigurator() {

  /**
   * Initialize buttons
   */
  $("#removeButton").click(() => {
    removeListItem(getFirstActiveListItem().id);
    validateConfig();
  })

  $("#removeAllButton").click(() => {
    let item = getFirstActiveListItem();
    while (item !== null) {
      removeListItem(item.id);
      item = getFirstActiveListItem();
    }
    validateConfig();
  })

  $("#dependenciesButton").click(() => {
    addAllDependencies();
  })

  deactivateContinueButton();

  /**
   * Get extension information
   */
  fetch("/static/extensions")
  .then(data => {
    return data.json();
  })
  .then((response) => {
    frontend = response.frontend;
    backend = response.backend;
    let front = response.frontend;
    let back = response.backend;
    /**
     * Update the coumn of frontend extensions.
     */
    updateColumn("fe-column", front);

    /**
     * Update the column for backend extensions.
     */
    updateColumn("be-column", back);
  });

  /**
   * Initialize predefined builds.
   */
  fetch("/static/predefinedBuilds")
  .then(data => {
    return data.json();
  })
  .then((response) => {
    addPredefinedBuilds(response.builds);
  });

}

/**
 * Initialize the column with images.
 * @param {string} colName
 * @param {Array} extensions
 */
function updateColumn(colName, extensions) {
  let column = document.getElementById(colName);
  let i;
  for (i = 0; i < extensions.length; i ++) {
    let element = extensions[i];
    if (hasChildName(column, element.name)) {
      // Skip if already added.
      continue;
    }
    const div = document.createElement("div");
    addClassToElement(div, "dropdown");
    addClassToElement(div, "extension-div");
    div.id = element.name;
    const img = document.createElement("img");
    img.classList.add("extension-img");
    checkImgSource(element.imgSrc)
    .then(
        (resp) => {img.src = resp; },
    );
    img.addEventListener("error", () => {
        img.src = "img/logo-default.png";
    });
    const id = element.id;
    const name = element.name;
    const versions = getDifferentVersions(element.name);
    if (versions.length > 1) {
      const button = document.createElement("button");
      addClassToElement(button, "btn");
      addClassToElement(button, "extension-button");
      button.setAttribute("data-toggle", "dropdown");
      const span = document.createElement("span");
      addClassToElement (span, "caret");
      button.appendChild(img);
      button.appendChild(span);
      div.appendChild(button);
      const ul = getVersionElementList(versions);
      div.appendChild(ul);
    } else {
      div.addEventListener("click", () => {
        if (div.classList.contains("selected")) {
          removeClassFromElement(div, "selected");
          removeListItems(name);
          validateConfig();
        } else {
          addClassToElement(div, "selected");
          removeListItems(name);
          addListItem(id);
          validateConfig();
        }
      });
      div.appendChild(img);
    }
    div.addEventListener("mouseover", () => {
      addClassToElement(div, "hovered");
      showSelectedExtensionById(id);
      clearTimeout(timeout);
    });
    div.addEventListener("mouseout", () => {
      removeClassFromElement(div, "hovered");
      timeout = setTimeout(() => {showSelectedExtensionById(null); }, 100);
    });
    column.appendChild(div);
  }
}

/**
 * Check if the image is a web or static resource. If neither is true use default image.
 * @param {String} imgSrc
 */
function checkImgSource(imgSrc) {
  if (imgSrc === null) {
    return Promise.reject();
  }
  if (imgSrc.startsWith("http")) {
    return Promise.resolve(imgSrc);
  } else {
    return Promise.resolve(
      $.ajax({
        type: "GET",
        url: "/static/img/" + imgSrc,
      }),
    );
  }
}

/**
 * Checks if an extension has different release Versions.
 */
function getDifferentVersions(name) {
  let versions = [];
  if (name.startsWith("backend")) {
      for (let i = 0; i < backend.length; i++) {
          if (backend[i].name === name) {
              versions.push(backend[i].id);
          }
      }
  } else if (name.startsWith("frontend")) {
      for (let i = 0; i < frontend.length; i++) {
          if (frontend[i].name === name) {
              versions.push(frontend[i].id);
          }
      }
  }
  return versions;
}

/**
 * Generate the dropdown menu for an extension with multiple versions.
 * @param {} versions 
 */
function getVersionElementList(versions) {
  const ul = document.createElement("ul");
  addClassToElement(ul, "dropdown-menu");

  for (let i = 0; i < versions.length; i++) {
    let extension = getExtensionById(versions[i]);
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.addEventListener("click", () => {
        removeListItems(extension.name);
        addListItem(extension.id);
        validateConfig();
    });
    a.textContent = extension.name.replace("extension-", "") + " " + extension.version;
    li.appendChild(a);
    ul.appendChild(li);
  }
  return ul;
}

/**
 * Check if an element alrady has a child with a certain name.
 * @param {HTMLElement} column
 * @param {string} name
 */
function hasChildName(column, name) {
  let hasChild = false;
  if (column.childElementCount > 0) {
    for (let i = 0; i < column.childElementCount; i++) {
      let childId = column.children[i].id;
      if (childId === name) {
        hasChild = true;
        break;
      }
    }
  }
  return hasChild;
}

/**
 * Remove one item by id from the currentBuildList.
 * @param {string} id
 */
function removeListItem(id) {
  let list = document.getElementById("currentBuildList");
  let child = document.getElementById(id);
  if (child !== null) {
    const extension = getExtensionById(id);
    list.removeChild(child);
    if (!(buildListHasExtensionName(extension.name) !== null)) {
      const imgName = document.getElementById(extension.name);
      removeClassFromElement(imgName, "selected");
    }
    if (list.childElementCount !== 0) {
      if (child.classList.contains("active")) {
        activateListItemById(list.children[list.childElementCount - 1].id);
      }
    } else {
      $("#removeButton").addClass("invisible");
      $("#removeAllButton").addClass("invisible");
    }
  }
}

/**
 * Remove all items of an extension group from the build list.
 * @param {string} groupName 
 */
function removeListItems(groupName) {
  let groupItem = buildListHasExtensionName(groupName);
  while(groupItem !== null) {
    removeListItem(groupItem);
    groupItem = buildListHasExtensionName(groupName);
  }
}

/**
 * Add one item to the currentBuildList and link it to the
 * corresponding image via id.
 * @param {string} id
 */
function addListItem(id) {
  deactivateActiveListItems();
  const extension = getExtensionById(id);
  let item = document.createElement("a");
  item.id = id;
  item.name = extension.name;
  item.classList.add("list-group-item");
  let content = document.createElement("h4");
  content.textContent = id.replace("extension-", "").replace("_", " (") + ")";
  content.classList.add("list-group-item-heading");
  item.appendChild(content);
  item.addEventListener("click", () => {
    if (!item.classList.contains("active")) {
      deactivateActiveListItems();
      activateListItemById(id);
    }
  });
  $(`#currentBuildList`).append(item);
  activateListItemById(id);
  $(`#${extension.name}`).addClass("selected");
}

/**
 * Add an array of extensions by ids with their dependencies to the current build list.
 */
function addListItems(ids) {
  ids.forEach(id => {
    addListItem(id);
  });
  addAllDependencies();
}

/**
 * Add the "active" class to an element determined by id.
 * @param {String} id
 */
function activateListItemById(id) {
  let item = document.getElementById(id);
  if (item !== null) {
    addClassToElement(item, "active");
    $(`#removeButton`).removeClass("invisible");
    $(`#removeAllButton`).removeClass("invisible");
    if (item.parentElement === document.getElementById("currentBuildList")) {
      showSelectedExtensionById(id);
    }
  }
}

/**
 * Updates the info-box with information about an extension defined by id.
 * @param {String} id
 */
function showSelectedExtensionById(id) {
  clearSelection();
  if (id !== null) {
    let extension = getExtensionById(id);
    if (extension !== null) {
      setInfoBoxHeading(extension.name.replace("extension-", "") + " (" + extension.version +  ")") ;
      let body = document.getElementById("info-box-body");
      let descHead = document.createElement("h4");
      let descContent = document.createElement("p");
      let reqContent = document.createElement("p");
      let reqHead = document.createElement("h4");
      descHead.textContent = "Description:";
      descContent.textContent = extension.desc;
      reqHead.textContent = "Required extensions:";
      let reqText = extension.requiredExtensions.toString();
      reqContent.textContent = reqText.replace("extension-", "").replace(/,/g, ", ");
      body.appendChild(descHead);
      body.appendChild(descContent);
      body.appendChild(reqHead);
      body.appendChild(reqContent);
      if (extension.incompatibleExtensions.length > 0) {
        let incHead = document.createElement("h4");
        incHead.textContent = "Incompatible with:";
        body.appendChild(incHead);
        let incContent = document.createElement("p");
        let incText = extension.incompatibleExtensions.toString();
        incContent.textContent = incText.replace("extension-", "").replace(/,/g, ", ");
        body.appendChild(incContent);
      }
      let urlContent = document.createElement("a");
      urlContent.textContent = "Visit GitHub repository";
      urlContent.href = extension.repository;
      urlContent.target = "_blank";
      body.appendChild(urlContent);
    }
  } else {
    let firstListItem = getFirstActiveListItem();
    if (firstListItem !== null) {
      showSelectedExtensionById(firstListItem.id);
    } else {
      setInfoBoxHeading("Please select an extension.");
    }
  }
}

/**
 * Set the infoBoxHeading to heading.
 * @param {String} heading
 */
function setInfoBoxHeading(heading) {
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
function clearSelection() {
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
 * Remove the active tag from all list items in the currentBuildList.
 */
function deactivateActiveListItems() {
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
    for (let i = 0; i < list.childElementCount; i++) {
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
  if (element !== null && element.classList.contains(cl)) {
    element.classList.remove(cl);
  }
}

/**
 * Adds a class to an Element if not present.
 * @param {Element} element
 * @param {String} cl
 */
function addClassToElement(element, cl) {
  if (element !== null && !element.classList.contains(cl)) {
    element.classList.add(cl);
  }
}

/**
 * Search for an entry with id
 * @param {String} id
 */
function getExtensionById(id) {
  let extension = null;
  if (id.includes("backend")) {
    for (let i = 0; i < backend.length; i++) {
      if (backend[i].id === id) {
        extension = backend[i];
      }
    }
  } else if (id.includes("frontend")) {
    for (let i = 0; i < frontend.length; i++) {
      if (frontend[i].id === id) {
        extension = frontend[i];
      }
    }
  }
  return extension;
}

/**
 * Validates the current config by checking the requirements and incompatibilities
 * of all elements corresponding to the children of currentBuildList.
 */
function validateConfig() {
  removeValitdationMarks();
  const status = {
    incompatible: [],
    required: [],
    wanted: []
  };
  let list = document.getElementById("currentBuildList");
  if (list.childElementCount > 0) {
    for (let i = 0; i < list.childElementCount; i++) {
      const childExtension = getExtensionById(list.children[i].id);
      const requiredExtensions = childExtension.requiredExtensions;
      const incompatibleExtensions = childExtension.incompatibleExtensions;
      if (!checkUnique(status.wanted, childExtension.name)) {
        status.incompatible.push(childExtension.id);
        $(`#${childExtension.name}`).addClass("incompatible")
        .attr("data-toggle", "tooltip").attr("title", `Multiple extensions of same group detected.`);
        continue;
      }
      status.wanted.push(childExtension);
      for (const requiredExtensionId of requiredExtensions) {
        if (status.wanted.includes(requiredExtensionId)) {
          continue;
        }
        const requiredExtension = getExtensionById(requiredExtensionId);
        if (requiredExtension !== null) {
          if (!buildListHasExtensionId(requiredExtensionId)
            && status.required.indexOf(requiredExtensionId) === -1 ) {
              $(`#${requiredExtension.name}`).addClass("required")
                .attr("data-toggle", "tooltip").attr("title", `${requiredExtension.id.replace("extension-", "")}`
                + ` required by ${childExtension.name.replace("extension-", "")}.`);
              status.required.push(requiredExtensionId);
          }
        } else {
          console.error(`Dependency ${requiredExtensionId} of ${childExtension.id} not found.`);
          status.incompatible.push(childExtension.id);
          $(`#${childExtension.name}`).addClass("incompatible")
            .attr("data-toggle", "tooltip").attr("title", `Extension ${requiredExtensionId.replace("extension-", "")} not available.`);
        }
      }
      for (const incompatibleExtension of incompatibleExtensions) {
        const incompatibility = buildListHasExtensionName(incompatibleExtension);
        if (incompatibility !== null) {
          $(`#${incompatibleExtension}`).addClass("incompatible")
            .attr("data-toggle", "tooltip").attr("title", `Incompatible with ${childExtension.name.replace("extension-", "")}.`);
          $(`#${childExtension.name}`).addClass("incompatible")
            .attr("data-toggle", "tooltip").attr("title", `Incompatible with ${incompatibleExtension.replace("extension-", "")}.`);
        }
      }
    }
  }
  return resolveValidation(status);
}

/**
 * Removes the required and incompatible classes from all extension-images.
 */
function removeValitdationMarks() {
  let elements = document.getElementsByClassName("extension-div");
  for (let i = 0; i < elements.length; i++) {
    removeClassFromElement(elements[i], "required");
    removeClassFromElement(elements[i], "incompatible");
    elements[i].removeAttribute("title");
  }
}

/**
 * Activate the continue button if inactive.
 * @param {{extensionType: any, name:string, repository:string, version:string}[]} configuration
 */
function activateContinueButton(configuration) {
  $(`#continueButton`)
  .removeClass("btn-danger")
  .addClass("btn-success")
  .attr("data-toggle", "tooltip")
  .attr("title", `Click to continue to the confirmation page.`)
  .click(() => continueOnClick(configuration))
  .prop('disabled', false)
}

/**
 * Deactivate the continue button if active.
 */
function deactivateContinueButton() {
  $(`#continueButton`)
  .removeClass("btn-success")
  .addClass("btn-danger")
  .attr("data-toggle", "tooltip")
  .attr("title", `Please select a valid build before continuing.`)
  .off("click")
  .prop('disabled', true)
}

/**
 * Post the configuration data to the server and load the confirmation page on success.
 * @param {{extensionType: any, name:string, repository:string, version:string}[]} configuration 
 */
function continueOnClick(configuration) {
  $.ajax({
    data: configuration,
    success: (res) => {
      window.location = `/confirmation/${res}`;
    },
    type: "POST",
    url: "/build/post",
  });
}

/**
 * Add all dependencies of selected extensions to the current build list.
 */
function addAllDependencies() {
  let list = document.getElementById("currentBuildList");
  if (list.childElementCount > 0) {
    for (let i = 0; i < list.childElementCount; i++) {
      let childId = list.children[i].id;
      let extensions = getExtensionById(childId);
      extensions.requiredExtensions.forEach(requiredExtension => {
        if (!buildListHasExtensionId(requiredExtension)
            && getExtensionById(requiredExtension) !== null) {
          addListItem(requiredExtension);
        }
      });
    }
    validateConfig();
  }
}

/**
 * Check if an extension with the id is present in the build list.
 * @param {string} id
 */
function buildListHasExtensionId(id) {
  let hasExtension = false;
  let list = document.getElementById("currentBuildList");
  if (list.childElementCount > 0) {
    for (let i = 0; i < list.childElementCount; i++) {
      let childId = list.children[i].id;
      if (childId === id) {
        hasExtension = true;
        break;
      }
    }
  }
  return hasExtension;
}

/**
 * Check if an extension with the id is present in the build list.
 * @param {string} name
 */
function buildListHasExtensionName(name) {
  let hasExtension = null;
  let list = document.getElementById("currentBuildList");
  if (list.childElementCount > 0) {
    for (let i = 0; i < list.childElementCount; i++) {
      let childName = getExtensionById(list.children[i].id).name;
      if (childName === name) {
        hasExtension = list.children[i].id;
        break;
      }
    }
  }
  return hasExtension;
}

/**
 * Trims an array of extensions to contain only build-relevant information.
 * @param {{extensionType: any, name:string, repository:string, version:string}[]} extensions
 */
function trimConfig(extensions) {
  let config = [];
  for (const extension of extensions) {
    const newExtension = {
      extensionType: extension.extensionType,
      name: extension.name,
      repository: extension.repository,
      version: extension.version,
      isBase: extension.isBase,
      id: extension.id
    };
    config.push(newExtension);
  }
  return config;
}

/**
 * Check if an extension is the only element of the same group in a list of extensions.
 * @param {any[]} extensions 
 * @param {string} extensionName 
 */
function checkUnique(extensions, extensionName) {
  let unique = true;
  extensions.forEach(ext => {
    if (ext.name === extensionName) {
      unique = false;
    }
  })
  return unique;
}

/**
 * Check if the given status of the build is valid, i.e. no further extensions are required or incompatible.
 * @param {{wanted:any[], required: string, incompatible: string}} status 
 */
function resolveValidation(status) {
  let valid = false;
  if (status.wanted.length > 0
    && status.required.length === 0
    && status.incompatible.length === 0) {
    activateContinueButton({config: trimConfig(status.wanted)});
    valid = true;
  } else {
    deactivateContinueButton();
    valid = false;
  }
  return valid;
}

/**
 * Add the builds obtained from predefinedBuilds.json to the list.
 * @param {{name:string, content:string[]}} builds
 */
function addPredefinedBuilds(builds) {
  const buildArr = Array.from(builds);
  const buildSelector = document.getElementById("buildSelector");
  buildArr.forEach(build => {
    let selector = document.createElement("li");
    let link = document.createElement("a");
    link.textContent = build.name;
    link.addEventListener("click", () => {
      let item = getFirstActiveListItem();
      while (item !== null) {
          removeListItem(item.id);
          item = getFirstActiveListItem();
      }
      addListItems(build.content);
    });
    selector.appendChild(link);
    buildSelector.appendChild(selector);
  });
}