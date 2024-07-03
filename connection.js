class Connection {
    server1;
    server2;
    capacity;
    highlighted;
    bfsHighlighted;
    orientation;
    flow;

    constructor(server1, server2, capacity, flow = 0, orientation = 'both', highlighted = false, bfsHighlighted = false) {
        this.server1 = server1;
        this.server2 = server2;
        this.capacity = capacity;
        this.flow = flow > capacity ? capacity : flow;
        this.orientation = orientation;
        this.highlighted = highlighted;
        this.bfsHighlighted = bfsHighlighted;
    }
}