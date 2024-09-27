const express = require('express');
const fs = require('fs').promises;


const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'requests.json');

let isLocked = false;



app.use(express.json());


const acquireLock = async () => {
    while (isLocked) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    isLocked = true;
};


const releaseLock = () => {
    isLocked = false;
};


const readRequests = async () => {
    await acquireLock();
    const data = await fs.readFile(FILE_PATH, 'utf-8');
    releaseLock();
    return JSON.parse(data);
};


const writeRequests = async (data) => {
    await acquireLock();
    await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
    releaseLock();
};


app.post('/requests', async (req, res) => {
    const { guestName, roomNumber, requestDetails, priority } = req.body;
    const newRequest = {
        id: uuidv4(),
        guestName,
        roomNumber,
        requestDetails,
        priority: parseInt(priority),
        status: 'received'
    };

    const requests = await readRequests();
    requests.push(newRequest);
    await writeRequests(requests);

    res.status(201).json({ message: 'Request added', request: newRequest });
});


app.get('/requests', async (req, res) => {
    const requests = await readRequests();
    const sortedRequests = requests.sort((a, b) => a.priority - b.priority);
    res.json(sortedRequests);
});


app.get('/requests/:id', async (req, res) => {
    const requests = await readRequests();
    const request = requests.find(r => r.id === req.params.id);

    if (!request) {
        return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
});


app.put('/requests/:id', async (req, res) => {
    const { guestName, roomNumber, requestDetails, priority, status } = req.body;
    const requests = await readRequests();
    const requestIndex = requests.findIndex(r => r.id === req.params.id);

    if (requestIndex === -1) {
        return res.status(404).json({ message: 'Request not found' });
    }

    const updatedRequest = {
        ...requests[requestIndex],
        guestName: guestName || requests[requestIndex].guestName,
        roomNumber: roomNumber || requests[requestIndex].roomNumber,
        requestDetails: requestDetails || requests[requestIndex].requestDetails,
        priority: priority ? parseInt(priority) : requests[requestIndex].priority,
        status: status || requests[requestIndex].status
    };

    requests[requestIndex] = updatedRequest;
    await writeRequests(requests);

    res.json({ message: 'Request updated', request: updatedRequest });
});


app.delete('/requests/:id', async (req, res) => {
    let requests = await readRequests();
    const requestIndex = requests.findIndex(r => r.id === req.params.id);

    if (requestIndex === -1) {
        return res.status(404).json({ message: 'Request not found' })
    }

    requests = requests.filter(r => r.id !== req.params.id);
    await writeRequests(requests);

    res.json({ message: 'Request deleted' });
});


app.post('/requests/:id/complete', async (req, res) => {
    const requests = await readRequests();
    const requestIndex = requests.findIndex(r => r.id === req.params.id);

    if (requestIndex === -1) {
        return res.status(404).json({ message: 'Request not found' });
    }

    requests[requestIndex].status = 'completed';
    await writeRequests(requests);

    res.json({ message: 'Request marked as completed', request: requests[requestIndex] });
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


