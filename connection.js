class Connection {
    server1;
    server2;
    capacity;
    highlighted;
    bfsHighlighted;
    orientation;

    constructor(server1, server2, capacity, orientation = 'both', highlighted = false, bfsHighlighted = false) {
        this.server1 = server1;
        this.server2 = server2;
        this.capacity = capacity;
        this.orientation = orientation;
        this.highlighted = highlighted;
        this.bfsHighlighted = bfsHighlighted;
    }
}