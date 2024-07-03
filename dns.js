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
                const ipAddress = server.ipAddress.join('.');
                if (record) {
                    record.ipAddresses.push(ipAddress);
                } else {
                    this.records.push({
                        'domain': domain,
                        'ipAddresses': [ipAddress]
                    });
                }
            }
        }
    }

    resolve(domain) {
        const record = this.records.find(record => record.domain === domain);
        if (record) {
            return record.ipAddresses;
        } else {
            throw new Error(`Erreur 404, url introuvable : '${domain}'`);
        }
    }
}
