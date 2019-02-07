const getGitRepoButton = document.getElementById('getGitRepoButton');

if (getGitRepoButton) { 
  getGitRepoButton.addEventListener('click', function(e) {
    console.log(`Button: ${getGitRepoButton.textContent} clicked!`);
    
    var text = getGitRepoButton.textContent;
    
    if (text === "TEST") {
      getGitRepoButton.textContent = "asdasd";
    } else {
      getGitRepoButton.textContent = "TEST";
    }
  });
}







