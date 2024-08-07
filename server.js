class Server {
    posX;
    posY;
    distance;
    name;
    websites;
    selected = false;
    disabled = false;
    colored = false;
    neighbours = [];
    previous;
    highlighted = false;
    bfsHighlighted = false;

    constructor(posX, posY, name, websites) {
        this.posX = posX;
        this.posY = posY;
        this.name = name;
        this.websites = websites;
    }

    static get radius() {
        return 25;
    }

    getName() {
        return this.name;
    }

    draw(context) {
        let circle = new Path2D();
        circle.arc(this.posX, this.posY, Server.radius, 0, 2 * Math.PI, false);

        if(this.disabled) {
            context.fillStyle = 'red'; // Fill color
        } else {
            context.fillStyle = 'blue'; // Fill color
        }
        context.fill(circle); // Fill the circle

        if(this.selected) {
            context.strokeStyle = '#FFFFFF'; // Stroke color
        } else if(this.highlighted) {
            context.strokeStyle = '#00FF00'; // Stroke color
        } else if (this.bfsHighlighted) {
            context.strokeStyle = '#FF0000'; // Stroke color
        } else {
            context.strokeStyle = '#000066'; // Stroke color
        }
        context.lineWidth = 5; // Stroke width
        context.stroke(circle); // Stroke the circle

        // Set the font properties
        context.font = '24px Arial';
        context.fillStyle = 'black';

        // Draw the text
        context.fillText(
            this.name,
            this.posX,
            this.posY + 2 * Server.radius
        );
    }

    contains(x, y) {
        // Calculate the distance between the point (x, y) and the center of the circle
        let distance = Math.sqrt(Math.pow(x - this.posX, 2) + Math.pow(y - this.posY, 2));

        // Check if the distance is less than or equal to the radius
        return distance <= Server.radius;
    }

}