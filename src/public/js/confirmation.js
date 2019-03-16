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
