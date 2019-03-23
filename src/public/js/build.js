const url = window.location.href.split("/");
const buildHash = url[url.length - 1];

fetch(`/build/get/${buildHash}`)
.then(data => {return data.json(); })
.then((res) => {
    let build = Array.from(res);
    build.sort((a, b) => a.name.localeCompare(b.name));
    build.forEach((elem) => {
        let item = $(`<li>${elem.name} (${elem.version})</li>`);
        $(`#currentBuildList`).append(item);
    });
});

function setProgress(progress, label)
{
    $("#progressbar")[0].style.width = progress + "%";
    $("#progress-label")[0].innerHTML = label;
}



function setProgressFailed()
{
    setProgress(100, "Failed. Please try again later.");
    $("#progressbar")[0].classList.add("progress-bar-danger");
    $("#progressbar")[0].classList.remove("active");
}

function startBuild()
{
    fetch(``, {  method: "POST" })
    .then(() => 
    {
        $("#startButtons")[0].style.visibility = "hidden";
        $("#progressRow")[0].style.display = "block";
        fetch(`/artifact/status/${buildHash}`)
            .then(data => {return data.json(); })
            .then(handleStatus);
    });
}

function handleStatus(data)
{
            switch(data)
            {
                case 1: 
                    setProgress(10, "Preparing Frontend...");
                    break; 
                case 2: 
                    setProgress(20, "Installing Frontend Extensions...");
                    break; 
                case 3:
                    setProgress(30, "Building Frontend...");
                    break;
                case 4:
                    setProgress(60, "Preparing Backend...");
                    break;
                case 5:
                    setProgress(60, "Compiling Backend...");
                    break;
                case 6:
                    setProgress(80, "Compiling Backend Extensions...");
                    break;
                case 7:
                    setProgress(90, "Preparing Download...");
                    break;
        case 8:
            setProgress(100, "Ready for Download!");
            break
        default:
            setProgressFailed();
    }
    setTimeout(() => 
    {
        fetch(`/artifact/status/${buildHash}`)
        .then(data => {return data.json(); })
        .then(handleStatus)
    }, 2000);
}


