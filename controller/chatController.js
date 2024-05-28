const Admin = require('../models/adminModel')
const { Server } = require('socket.io');
const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const Chat = require('../models/chatModel')
const adminToUserMap = new Map();
const userSocketsMap = new Map(); 

const LoadchatPage = async (req, res) => {
    try {
        const adminId = '65f3dc6f869178892bffa9f3'
        const userId = req.session.user_id
        const userdata = await User.findOne({ _id: userId })
        const cartCount = await Cart.countDocuments({ userId: req.session.user_id });

        const wishlistCount = userdata.wishlist.length
        res.render('user/chatPage',
            {
                user: true,
                id: userId,
                receiverId: adminId,
                userId: userId,
                userdata,
                cartCount,
                wishlistCount
            })

    } catch (error) {
        console.log('error', error);

    }
}

const chatbox = (server) => {
    try {
        const io = new Server(server);

        const usp = io.of('/user-namespace');
        const adminsp = io.of('/admin-namespace');

        const userToAdminMap = new Map();
        
        usp.on('connection', async (userSocket) => {

            console.log('A user connected');
           
            adminsp.emit('userConnected', userSocket.id);

            
            const authToken = userSocket.handshake.auth.token;
            userSocketsMap.set(authToken, userSocket);
        
            
           await User.updateOne({ _id: userSocket.handshake.auth.token }, { $set: { chatStatus: true } });
        
            userSocket.on('disconnect', async () => {
                console.log('User disconnected');
               
                await User.updateOne({ _id: userSocket.handshake.auth.token }, { $set: { chatStatus: false } });
        

                if (userToAdminMap.has(userSocket)) {
                    const adminSocket = userToAdminMap.get(userSocket);
                    userToAdminMap.delete(userSocket);
                    adminSocket.emit('userDisconnected');
                }

                userSocketsMap.delete(authToken);
            });
        
            userSocket.on('user message', (data) => {

                

                const adminSocket = adminToUserMap.get(data.userSocketId);

        
                if (adminSocket) {
                    
                    adminSocket.emit('user message', data);
                    

                } else {

                    const messageFromServer = 'No admin connected yet';
                    userSocket.emit('admin message', messageFromServer);
                    console.log('No admin connected yet.');

                }
            });
        });
        
        
        adminsp.on('connection', (adminSocket) => {
            
            console.log('Admin connected:', adminSocket.id);

            const authToken = adminSocket.handshake.auth.token;
            adminToUserMap.set(authToken, adminSocket);
        
            adminSocket.on('disconnect', () => {
                console.log('Admin disconnected:', adminSocket.id);
               
                userToAdminMap.forEach((admin, user) => {
                    if (admin === adminSocket) {
                        userToAdminMap.delete(user);
                    }

                });
            });
        
            adminSocket.on('userConnect', (userSocketId) => {
                console.log('Admin connecting to user:', userSocketId);
              
                const userSocket = usp.sockets.sockets[userSocketId];
                if (userSocket) {
                    userToAdminMap.set(userSocket, adminSocket);
                    adminSocket.emit('userConnected', userSocketId);
                } else {
                    console.log('User socket not found:', userSocketId);
                }
            });
        
            adminSocket.on('admin message', (data) => {
                console.log('Admin message: ' + JSON.stringify(data));
                
                const userSocket = userSocketsMap.get(data.userSocketId);

    
                if (userSocket) {
                    console.log('Admin message forwarded to user: ' + data.userSocketId);
                    userSocket.emit('admin message', data);
                }
            });
        });
        

    } catch (error) {
        console.log("eror in socket",error);

    }
}

const saveChat = async (req, res) => {
    try {
        const adminId = '65f3dc6f869178892bffa9f3'
        const { message, senderId, receiverId } = req.body
        console.log('userInput', message);

        const chat = new Chat({
            senderId: senderId,
            recieverId: receiverId,
            message: message
        })
        const newChat = await chat.save()
        res.status(200).json({ success: true, data: newChat })

    } catch (error) {
        res.json({ success: false })
        console.log('error in save chat page', error);
    }
}


const adminChatPage = async (req, res) => {
    try {
      
        const userdata = await User.find({chatStatus:true })
        const adminId='65f3dc6f869178892bffa9f3'

        res.render('chat', { activePage: 'chat', userdata,adminId })

    } catch (error) {
        console.log('error in adminchat', error);
    }
}



const handleAdminSockets = (server) => {
    const io = new Server(server);
    const adminSocket = io.of('/admin-socket');

    adminSocket.on('connection', (socket) => {
        console.log('Admin connected');

        socket.on('newChat', (data) => {
            console.log('Received new chat:', data);

            socket.emit('loadNewChat', data);
        });

        socket.on('disconnect', () => {
            console.log('Admin disconnected');
        });
    });
};
module.exports = {
    LoadchatPage,
    chatbox,
    saveChat,
    adminChatPage,
    handleAdminSockets

}