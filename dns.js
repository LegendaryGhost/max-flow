class DNS {
    records;
    network;

    constructor(network) {
        this.network = network;
        this.records = []; // This will hold all DNS records
    }

    updateRecords() {
        this.records = [];
        for (const server of network.servers) {
            for (const domain of server.websites) {
                const record = this.records.find(record => record.domain === domain)
                const name = server.name;
                if (record) {
                    record.names.push(name);
                } else {
                    this.records.push({
                        'domain': domain,
                        'names': [name]
                    });
                }
            }
        }
    }

    resolve(domain) {
        const record = this.records.find(record => record.domain === domain);
        if (record) {
            return record.names;
        } else {
            throw new Error(`Erreur 404, url introuvable : '${domain}'`);
        }
    }
}
