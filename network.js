class Network {
    servers = [];
    connections = [];
    selectedServer = null;
    linkingMode = false;

    constructor() {
        this.servers = [
            new Server(50, 50, [127, 0, 0, 1], []),
            new Server(30, 500, [127, 0, 0, 2], ['facebook.com']),
            new Server(400, 30, [127, 0, 0, 3], []),
            new Server(200, 300, [127, 0, 0, 4], []),
            new Server(400, 300, [127, 0, 0, 5], ['facebook.com'])
        ]
        this.addConnection(this.servers[0], this.servers[3], 10);
        this.addConnection(this.servers[0], this.servers[2], 7);
        this.addConnection(this.servers[0], this.servers[4], 69);
        this.addConnection(this.servers[1], this.servers[3], 11);
        this.addConnection(this.servers[3], this.servers[4], 6);
        this.addConnection(this.servers[2], this.servers[4], 4);
    }

    draw(canvas, context, clientX, clientY) {
        context.fillStyle = "grey"; // Set the fill color to blue
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (this.linkingMode) {
            context.strokeStyle = '#FFFFFF';
            context.lineWidth = 5; // Stroke width
            context.beginPath(); // Reset the current path
            context.moveTo(this.selectedServer.posX, this.selectedServer.posY); // Starting point
            context.lineTo(clientX, clientY); // Ending point
            context.stroke(); // Draw the line
        }

        context.lineWidth = 5; // Stroke width
        for (const connection of this.connections) {
            context.strokeStyle = connection.highlighted ? '#00FF00' : (connection.bfsHighlighted ? '#FF0000' : '#000066');
            const x1 = connection.server1.posX;
            const y1 = connection.server1.posY;
            const x2 = connection.server2.posX;
            const y2 = connection.server2.posY;
            context.beginPath(); // Reset the current path
            context.moveTo(x1, y1); // Starting point
            context.lineTo(x2, y2); // Ending point
            context.stroke(); // Draw the line

            // Set the font properties
            context.font = '15px Arial';
            context.fillStyle = 'black';

            // Draw the text
            context.fillText(
                connection.latency,
                x1 + (x2 - x1) / 2 - 15,
                y1 + (y2 - y1) / 2 - 15
            );
        }

        this.servers.forEach(server => server.draw(context));
    };

    addServer(server) {
        this.servers.push(server);
    }

    deleteServer(deletedServer) {
        const deletedIp = deletedServer.getIpString();
        this.servers = this.servers.filter(server => server.ipAddress.join('.') !== deletedIp);
        this.servers.forEach(
            server => server.neighbours = server.neighbours.filter(
                neighbour => neighbour.getIpString() !== deletedIp
            )
        );
        this.connections = this.connections.filter(connection => connection.server1.getIpString() !== deletedIp && connection.server2.getIpString() !== deletedIp)
        this.selectedServer = this.selectedServer.getIpString() === deletedIp ? null : this.selectedServer;
    }

    addConnection(server1, server2, latency) {
        this.connections = this.connections.filter(
            connection =>
                !(connection.server1.getIpString() === server1.getIpString() && connection.server2.getIpString() === server2.getIpString()) &&
                !(connection.server1.getIpString() === server2.getIpString() && connection.server2.getIpString() === server1.getIpString())
        );
        this.connections.push({ server1, server2, latency, highlighted: false, bfsHighlighted: false });
        server1.neighbours.push(server2);
        server2.neighbours.push(server1);
    }

    dijkstra(senderIp, receiverIp) {
        const senderServer = this.servers.find(server => server.ipAddress.join('.') === senderIp);
        const receiverServer = this.servers.find(server => server.ipAddress.join('.') === receiverIp);
        let currentServer = senderServer;

        this.servers.forEach(server => {
            server.colored = false;
            server.distance = Infinity;
            server.previous = null;
        });
        senderServer.distance = 0;

        while (currentServer) {
            const currentIp = currentServer.ipAddress.join('.');
            currentServer.colored = true;
            currentServer.neighbours.forEach(neighbour => {
                const neighbourIp = neighbour.ipAddress.join('.');
                const connection = this.connections.find(
                    connection =>
                        (connection.server1.ipAddress.join('.') === currentIp && connection.server2.ipAddress.join('.') === neighbourIp) ||
                        (connection.server1.ipAddress.join('.') === neighbourIp && connection.server2.ipAddress.join('.') === currentIp)
                );
                const distance = currentServer.distance + connection.latency;
                if(!neighbour.colored && !neighbour.disabled && distance < neighbour.distance) {
                    neighbour.distance = distance;
                    neighbour.previous = currentServer;
                }
            });

            currentServer = null;
            for (const server of this.servers) {
                if (!server.colored && !server.disabled) {
                    if (!currentServer) {
                        currentServer = server;
                    } else if(server.distance < currentServer.distance) {
                        currentServer = server;
                    }
                }
            }
        }

        const shortestPath = [];
        let previous = receiverServer;
        while (previous) {
            shortestPath.push(previous);
            previous = previous.previous;
        }

        return {path: shortestPath, distance: receiverServer.distance};
    }

    bfs(senderIp, receiverIp) {
        const senderServer = this.servers.find(server => server.ipAddress.join('.') === senderIp);
        const receiverServer = this.servers.find(server => server.ipAddress.join('.') === receiverIp);

        this.servers.forEach(server => {
            server.colored = false;
            server.previous = null;
        });
        senderServer.colored = true;
        let queue = [ senderServer ];

        while (queue.length !== 0) {
            const currentServer = queue.shift();
            for(const neighbour of currentServer.neighbours) {
                if (!neighbour.colored && !neighbour.disabled) {
                    neighbour.colored = true;
                    neighbour.previous = currentServer;
                    queue.push(neighbour);
                }
            }
        }

        const shortestPath = [];
        let previous = receiverServer;
        while (previous) {
            shortestPath.push(previous);
            previous = previous.previous;
        }

        if(shortestPath.length === 0 && senderIp !== receiverIp) {
            return []
        }

        return shortestPath;
    }

    highlightPath(path, bfsHighlight) {
        this.servers.forEach(
            server => {
                if (bfsHighlight) {
                    server.bfsHighlighted = false;
                } else {
                    server.highlighted = false;
                }
            }
        );
        this.connections.forEach(
            connection => {
                if (bfsHighlight) {
                    connection.bfsHighlighted = false;
                } else {
                    connection.highlighted = false;
                }
            }
        );
        path.forEach(server => {
            if (bfsHighlight) {
                server.bfsHighlighted = true;
            } else {
                server.highlighted = true;
            }
        });
        for (let i = 0; i <= path.length - 2; i++) {
            const server1 = path[i];
            const server2 = path[i + 1];
            const connection = this.connections.find(
                connection =>
                    connection.server1.getIpString() === server1.getIpString() && connection.server2.getIpString() === server2.getIpString() ||
                    connection.server1.getIpString() === server2.getIpString() && connection.server2.getIpString() === server1.getIpString()
            );
            if (connection) {
                if (bfsHighlight) {
                    connection.bfsHighlighted = true;
                } else {
                    connection.highlighted = true;
                }
            }
        }
    }
}