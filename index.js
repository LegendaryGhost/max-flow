const popUpBackground = document.getElementById('pop-up-background');
const addServerForm = document.getElementById('add-server-form');
const addServerMenu = document.getElementById("add-server-context");
const serverMenu = document.getElementById("server-context");
const linkingForm = document.getElementById('linking-form');
const selectedServerForm = document.getElementById("selected-server-form");
const urlSearchForm = document.getElementById('url-search-form');
const canvas = document.getElementById('network');
const context = canvas.getContext('2d');
const network = new Network();
const dns = new DNS(network);
let toLinkServer = null,
    diffX = 0,
    diffY = 0,
    dragging = false;

/** Functions **/
const getCanvasRelativeCoordinate = (absolute_x, absolute_y) => {
    const canvasRect = canvas.getBoundingClientRect();
    const x = absolute_x - canvasRect.left;
    const y = absolute_y - canvasRect.top;
    return {'x': x, 'y': y};
};

const selectServer = server => {
    for (const serverElement of network.servers) {
        serverElement.selected = false;
    }
    server.selected = true;
    network.selectedServer = server;
    selectedServerForm.querySelector('#selected-ip').textContent = server.name;
    selectedServerForm.querySelector('#selected-websites').value = server.websites.join(';');
    selectedServerForm.querySelector('#selected-disable').textContent = server.disabled ? 'Rallumer' : 'Eteindre';
    network.draw(canvas, context);
};

addServerForm.addEventListener('reset', () => {
    popUpBackground.style.display = 'none';
    addServerForm.style.display = 'none';
    addServerMenu.style.display = 'none';
});

addServerForm.addEventListener('submit', event => {
    event.preventDefault();
    const {x, y} = getCanvasRelativeCoordinate(parseInt(addServerMenu.style.left), parseInt(addServerMenu.style.top));
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const sameNameServer = network.servers.find(server => server.name === name);
    let websitesArray = [...new Set(formData.get('websites').split(';'))];
    // Check if the resulting array contains only an empty string
    if (websitesArray.length === 1 && websitesArray[0] === '') {
        // If so, set websitesArray to an empty array
        websitesArray = [];
    }
    websitesArray = websitesArray.map(website => website.trim());

    if (sameNameServer) {
        alert(`L'adresse IP ${name} est déjà utilisée`);
        return;
    }

    network.addServer(new Server(x, y, name, websitesArray));
    network.draw(canvas, context);
    dns.updateRecords();
    addServerForm.reset();
});

addServerMenu.querySelector("button").addEventListener('click', () => {
    popUpBackground.style.display = 'block';
    addServerForm.style.display = 'block';
});

serverMenu.querySelector("button#link-server").addEventListener('click', () => {
    network.linkingMode = true;
    network.draw(canvas, context);
});

selectedServerForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!network.selectedServer) {
        alert("Aucun serveur n'a été sélectionné !");
        return;
    }

    const formData = new FormData(event.target);
    const submitter = event.submitter;

    if (submitter.id === 'selected-disable') {
        network.selectedServer.disabled = !network.selectedServer.disabled;
        selectServer(network.selectedServer);
    } else {
        let websitesArray = [...new Set(formData.get('selected-websites').split(';'))];
        // Check if the resulting array contains only an empty string
        if (websitesArray.length === 1 && websitesArray[0] === '') {
            // If so, set websitesArray to an empty array
            websitesArray = [];
        }
        websitesArray = websitesArray.map(website => website.trim());
        network.selectedServer.websites = websitesArray;
        dns.updateRecords();
        alert('Les données du serveur ont été sauvegardées');
    }
    network.draw(canvas, context);
});

selectedServerForm.addEventListener('reset', () => {
    if (!network.selectedServer) {
        alert("Aucun serveur n'a été sélectionné !");
        return;
    }

    network.deleteServer(network.selectedServer);
    selectedServerForm.querySelector('#selected-ip').textContent = '0.0.0.0';
    dns.updateRecords();
    network.draw(canvas, context);
});

urlSearchForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!network.selectedServer) {
        alert("Aucun serveur n'a été sélectionné !");
        return;
    }
    if(network.selectedServer.disabled) {
        alert("Le serveur sélectionné est éteint !");
        return;
    }

    const url = (new FormData(event.target)).get('url').toString();
    const senderIp = network.selectedServer.name;
    let receiverIps;

    try {
        receiverIps = dns.resolve(url);
        let currentPath = [], currentDistance = Infinity;
        for (const receiverIp of receiverIps) {
            const {path, distance} = network.dijkstra(senderIp, receiverIp);
            if (distance < currentDistance) {
                currentDistance = distance;
                currentPath = path;
            }
        }
        let bfsPath = network.bfs(senderIp, receiverIps[0]);
        for (const receiverIp of receiverIps) {
            const path = network.bfs(senderIp, receiverIp);
            if (path.length < bfsPath.length && path.length !== 0) {
                bfsPath = path;
            }
        }
        if (currentPath.length === 0) {
            network.highlightPath([]);
            network.highlightPath([], true);
            network.draw(canvas, context);
            alert(`Url : '${url}' inatteignable !`);
            return;
        }
        network.highlightPath(currentPath);
        network.highlightPath(bfsPath, true);
        network.draw(canvas, context);
    } catch (e) {
        alert(e.message);
    }
});

linkingForm.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const capacity = parseInt(formData.get('capacity').toString());
    const flow = parseInt(formData.get('flow').toString());
    const orientation = formData.get('orientation').toString();
    network.addConnection(network.selectedServer, toLinkServer, capacity, flow, orientation);
    network.linkingMode = false;
    linkingForm.reset();
    network.draw(canvas, context);
});

linkingForm.addEventListener('reset', () => {
    popUpBackground.style.display = 'none';
    linkingForm.style.display = 'none';
    toLinkServer = null;
});

canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    let clickedOnServer = false;
    for (const server of network.servers) {
        const {x, y} = getCanvasRelativeCoordinate(event.x, event.y);
        if (server.contains(x, y)) {
            selectServer(server);
            clickedOnServer = true;
            break;
        }
    }

    if (clickedOnServer) {
        serverMenu.style.top = event.y + "px";
        serverMenu.style.left = event.x + "px";
        serverMenu.style.display = "block";
        addServerMenu.style.display = 'none';
    } else {
        addServerMenu.style.top = event.y + "px";
        addServerMenu.style.left = event.x + "px";
        addServerMenu.style.display = "block";
        serverMenu.style.display = 'none';
    }

    network.draw(canvas, context);
});

canvas.addEventListener('click', event => {
    const {x, y} = getCanvasRelativeCoordinate(event.x, event.y);
    let clickedServer = null;
    for (const server of network.servers) {
        if (server.contains(x, y)) {
            clickedServer = server;
        }
    }

    if(network.linkingMode) {
        if (clickedServer && clickedServer.name !== network.selectedServer.name) {
            toLinkServer = clickedServer;
            popUpBackground.style.display = 'block';
            linkingForm.style.display = 'block';
            return;
        }
        network.linkingMode = false;
        network.draw(canvas, context);
    } else if (clickedServer) {
        selectServer(clickedServer);
    }
});

canvas.addEventListener('mousedown', event => {
    const {x, y} = getCanvasRelativeCoordinate(event.x, event.y);

    if (!network.selectedServer) {
        return;
    }
    if(!network.selectedServer.contains(x, y)) {
        return;
    }
    diffX = network.selectedServer.posX - x;
    diffY = network.selectedServer.posY - y;
    dragging = true;
});

canvas.addEventListener('mouseup', () => {
    diffX = 0;
    diffY = 0;
    dragging = false;
});

canvas.addEventListener('mousemove', event => {
    const {x, y} = getCanvasRelativeCoordinate(event.x, event.y);
    if (dragging) {
        network.selectedServer.posX = x + diffX;
        network.selectedServer.posY = y + diffY;
    }
    network.draw(canvas, context, x, y);
});

document.addEventListener('click', () => {
    addServerMenu.style.display = 'none';
    serverMenu.style.display = 'none';
});

// Intializing
network.initialize();
dns.updateRecords();
network.draw(canvas, context);
