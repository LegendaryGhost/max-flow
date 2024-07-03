class Network {
    servers = [];
    connections = [];
    selectedServer = null;
    linkingMode = false;

    constructor() {}

    initialize() {
        this.servers = [
            new Server(50, 50, 'A', []),
            new Server(30, 500, '1', ['facebook.com']),
            new Server(400, 30, '2', []),
            new Server(200, 300, '3', []),
            new Server(400, 300, 'W', ['facebook.com'])
        ]
        this.addConnection(this.servers[0], this.servers[3], 10, 3, 'forward');
        this.addConnection(this.servers[0], this.servers[2], 7, 1, 'forward');
        this.addConnection(this.servers[0], this.servers[4], 69, 10, 'forward');
        this.addConnection(this.servers[1], this.servers[3], 11, 0, 'forward');
        this.addConnection(this.servers[3], this.servers[4], 6, 3, 'forward');
        this.addConnection(this.servers[2], this.servers[4], 4, 1, 'forward');
    }

    draw(canvas, context, clientX, clientY) {
        context.fillStyle = "grey"; // Set the fill color to grey
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (this.linkingMode) {
            this.drawLine(context, this.selectedServer.posX, this.selectedServer.posY, clientX, clientY, '#FFFFFF');
        }

        context.lineWidth = 5; // Stroke width
        for (const connection of this.connections) {
            this.drawConnection(context, connection);
        }

        this.servers.forEach(server => server.draw(context));
    }

    drawLine(context, x1, y1, x2, y2, color = '#000066') {
        context.strokeStyle = color;
        context.lineWidth = 5; // Stroke width
        context.beginPath(); // Reset the current path
        context.moveTo(x1, y1); // Starting point
        context.lineTo(x2, y2); // Ending point
        context.stroke(); // Draw the line
    }

    drawString(string, x, y, color = 'black', font = '16px Arial') {
        context.font = font;
        context.fillStyle = color;
        context.fillText(
            string,
            x,
            y
        );
    }

    drawTriangle(x, y, angle, color = '#000066', triangleHeight = 20) {
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - triangleHeight * Math.cos(angle - Math.PI / 6), y - triangleHeight * Math.sin(angle - Math.PI / 6));
        context.lineTo(x - triangleHeight * Math.cos(angle + Math.PI / 6), y - triangleHeight * Math.sin(angle + Math.PI / 6));
        context.closePath();
        context.fill();
    }

    drawConnection(context, connection) {
        const connectionColor = connection.highlighted ? '#00FF00' : (connection.bfsHighlighted ? '#FF0000' : '#000066');
        const x1 = connection.server1.posX;
        const y1 = connection.server1.posY;
        const x2 = connection.server2.posX;
        const y2 = connection.server2.posY;

        this.drawLine(context, x1, y1, x2, y2, connectionColor);

        // Draw the capacity
        this.drawString(
            connection.capacity,
            x1 + (x2 - x1) / 2 + 15,
            y1 + (y2 - y1) / 2 + 15,
            'red'
        );

        // Draw the flow
        this.drawString(
            connection.flow,
            x1 + (x2 - x1) / 2 - 15,
            y1 + (y2 - y1) / 2 - 15,
            '#00FF00'
        );

        if(connection.orientation === 'forward' || connection.orientation === 'both') {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const triangleX = x2 - Server.radius * Math.cos(angle);
            const triangleY = y2 - Server.radius * Math.sin(angle);
            this.drawTriangle(triangleX, triangleY, angle, connectionColor);
        }

        if(connection.orientation === 'backward' || connection.orientation === 'both') {
            const angle2 = Math.atan2(y1 - y2, x1 - x2);
            const triangleX2 = x1 - Server.radius * Math.cos(angle2);
            const triangleY2 = y1 - Server.radius * Math.sin(angle2);
            this.drawTriangle(triangleX2, triangleY2, angle2, connectionColor);
        }
    }

    addServer(server) {
        this.servers.push(server);
    }

    deleteServer(deletedServer) {
        const deletedIp = deletedServer.getName();
        this.servers = this.servers.filter(server => server.name !== deletedIp);
        this.servers.forEach(
            server => server.neighbours = server.neighbours.filter(
                neighbour => neighbour.getName() !== deletedIp
            )
        );
        this.connections = this.connections.filter(connection => connection.server1.getName() !== deletedIp && connection.server2.getName() !== deletedIp)
        this.selectedServer = this.selectedServer.getName() === deletedIp ? null : this.selectedServer;
    }

    addConnection(server1, server2, capacity, flow, orientation) {
        this.connections = this.connections.filter(
            connection =>
                !(connection.server1.getName() === server1.getName() && connection.server2.getName() === server2.getName()) &&
                !(connection.server1.getName() === server2.getName() && connection.server2.getName() === server1.getName())
        );
        
        this.addConnectionWithoutCheck(server1, server2, capacity, flow, orientation);
    }

    addConnectionWithoutCheck(server1, server2, capacity, flow, orientation) {
        this.connections.push(new Connection(server1, server2, capacity, flow, orientation));

        server1.neighbours = server1.neighbours.filter(server => server.getName() !== server2.getName());
        server1.neighbours.push(server2);
        server2.neighbours = server2.neighbours.filter(server => server.getName() !== server1.getName());
        server2.neighbours.push(server1);
    }

    generateResidualGraph(sourceName, wellName) {
        const residualGraph = new Network();
        for (const server of this.servers) {
            residualGraph.addServer(server);
        }
        for (const connection of this.connections) {
            const forwardCapacity = connection.capacity - connection.flow;
            if (forwardCapacity !== 0) {
                residualGraph.addConnectionWithoutCheck(connection.server1, connection.server2, forwardCapacity);
            }
            if (connection.flow !== 0) {
                residualGraph.addConnectionWithoutCheck(connection.server2, connection.server1, connection.flow);
            }
        }
        // const source = residualGraph.servers.filter(server => server.name === sourceName);
        // const well = residualGraph.servers.filter(server => server.name === wellName);
        return residualGraph;
    }

    dijkstra(senderIp, receiverIp) {
        const senderServer = this.servers.find(server => server.name === senderIp);
        const receiverServer = this.servers.find(server => server.name === receiverIp);
        let currentServer = senderServer;

        this.servers.forEach(server => {
            server.colored = false;
            server.distance = Infinity;
            server.previous = null;
        });
        senderServer.distance = 0;

        while (currentServer) {
            const currentIp = currentServer.name;
            currentServer.colored = true;
            currentServer.neighbours.forEach(neighbour => {
                const neighbourIp = neighbour.name;
                const connection = this.connections.find(
                    connection =>
                        (connection.server1.name === currentIp && connection.server2.name === neighbourIp) ||
                        (connection.server1.name === neighbourIp && connection.server2.name === currentIp)
                );
                const distance = currentServer.distance + connection.capacity;
                if (!neighbour.colored && !neighbour.disabled && distance < neighbour.distance) {
                    neighbour.distance = distance;
                    neighbour.previous = currentServer;
                }
            });

            currentServer = null;
            for (const server of this.servers) {
                if (!server.colored && !server.disabled) {
                    if (!currentServer) {
                        currentServer = server;
                    } else if (server.distance < currentServer.distance) {
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
        const senderServer = this.servers.find(server => server.name === senderIp);
        const receiverServer = this.servers.find(server => server.name === receiverIp);

        this.servers.forEach(server => {
            server.colored = false;
            server.previous = null;
        });
        senderServer.colored = true;
        let queue = [senderServer];

        while (queue.length !== 0) {
            const currentServer = queue.shift();
            for (const neighbour of currentServer.neighbours) {
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

        if (shortestPath.length === 0 && senderIp !== receiverIp) {
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
                    connection.server1.getName() === server1.getName() && connection.server2.getName() === server2.getName() ||
                    connection.server1.getName() === server2.getName() && connection.server2.getName() === server1.getName()
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