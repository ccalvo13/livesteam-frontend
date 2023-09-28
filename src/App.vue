<template>
  <div data-app id="app">
   
    <Adsense
      data-ad-client="ca-pub-7023023584987784"
      data-ad-slot="5070366491" style="height: 0;">
    </Adsense>
     <div>
        <div>
          <form>
            <!-- <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2" for="room-input">
                Room ID
              </label>
              <input v-model="roomId" placeholder="Enter room ID" id="room-input" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
            </div> -->
            <div class="video-container"> 
              <vue-webrtc id="call-canvas" :roomId="roomId" ref="webrtc" v-on:share-started="shareStarted"  class="w-full video-webrtc" v-on:share-stopped="leftRoom" v-on:left-room="leftRoom" v-on:joined-room="joinedRoom" width="100%"/>
            </div>
            <div class="video-webrtc-controls" v-if="hasJoined">
              <!-- <button type="button" @click="copyClipboard" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Share Meeting</button> -->
              
              <v-btn @click="onHandleVideoOn" class="mx-2 bg-primary" size="x-large"><v-icon>{{videoOn ?  'mdi-video-outline': 'mdi-video-off-outline' }} </v-icon></v-btn>
              <v-btn @click="onHandleMicOn" class="mx-2 bg-primary" size="x-large"><v-icon>{{micOn ?  'mdi-microphone': 'mdi-microphone-off' }} </v-icon></v-btn>
              <!-- <v-btn @click="screenShare" class="mx-2" size="x-large">Screen Share</v-btn> -->
              <v-btn @click="toggleRoom" class="mx-2 bg-red" size="x-large" ><v-icon>mdi-phone-hangup</v-icon></v-btn>
              <v-dialog v-model="dialog" width="auto">
                <v-card>
                  <v-card-title class="text-h5">
                    End the call or just leave?
                  </v-card-title>
                  <v-card-text>You can just leave the call if you don't want to end it for everyone else</v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="meetingRoomEnd()" style="margin-right: 15px">
                      Just leave the call
                    </v-btn>
                    <v-btn variant="text" @click="meetingRoomEndForEveryone()">
                      End the call for everyone
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
               <v-snackbar
                v-model="snackbar"
                :timeout=3000
              >
                {{ textUserStatus }}

                <template v-slot:actions>
                  <v-btn
                    color="blue"
                    variant="text"
                    @click="snackbar = false"
                  >
                    Close
                  </v-btn>
                </template>
              </v-snackbar>
            </div>
          </form>

        </div>
 
    </div>


  </div>

</template>

<script lang="ts">
import axios from 'axios';
import { io } from 'socket.io-client';
import { ref } from 'vue';
const socket = io('https://livestream-backend-ng53ixt7xq-as.a.run.app');

export default {
  name: 'App',
  data () {
    return {
      el: ref(null),
      roomId: 'roomId',
      hasJoined: false,
      videoOn: true,
      micOn: true,
      mediaRecorder: {},
      chunks: [],
      userStream: {},
      // socket: io('https://livestream-backend-ng53ixt7xq-as.a.run.app'),
      audioContext: null,
      videoContainer: null,
      stream: null,
      dialog: false,
      snackbar: false,
      isHost: '',
      streamId: '',
      textUserStatus: 'User Join',
      isRecording: false,
      mediaStream: null,
    }
  },
  mounted () {
    socket.on('deleteUser', ({ roomId, sessionId }) => {
      if(this.roomId === roomId){
        this.snackbar = true;
        this.textUserStatus = `User ( ${sessionId} ) has left the meeting room.`;  
      }
      
    });

    socket.on('join', ({ roomId, sessionId }) => {
      if(this.roomId === roomId){
        this.snackbar = true;
        this.textUserStatus = `User ( ${sessionId} ) has join the meeting room.`;
      }
    });

    socket.on('talking', ({ sessionId, isTalking }) => {
        this.videoContainer  = document.querySelector(`.video-item video[id='${sessionId}']`);
        
        // styling for video border: when user is talking
        if (isTalking && this.videoContainer) {
          this.videoContainer.style.border =  'thick solid #FF6B35';
        } else {
          if(this.videoContainer){
            this.videoContainer.style.border =  'none';
          }
        }
    });
    
    
    const hash =  window.location.hash
    if(hash != '') {
      this.roomId = hash.substring(1)
      this.toggleRoom()
    }
  },
  created(){
    this.audioContext = new (window.AudioContext)();
     window.addEventListener('beforeunload', function(event) {
      console.log('event onload create: ', event);
        event.returnValue = 'Write something'
    })
  },
  methods: {
    async onStop (streamId) {
      console.log('streamId: ', streamId);
    },
    async onDownloadLocal(){
      this.$refs.webrtc.leave()
      this.hasJoined = false
      this.stopListening();
      // this.mediaRecorder.stop();
       if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();

        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
        }

        this.isRecording = false;
      }
      await axios.delete( `https://livestream-backend-ng53ixt7xq-as.a.run.app/users/list/${this.roomId}/${this.userStream.id}`);
      socket.emit('usersList', { roomId: this.roomId });
      socket.emit('deleteUser', { roomId: this.roomId, sessionId: this.userStream.id });
      
      var blob = new Blob(this.chunks, { 'type' : 'video/webm' }); // other types are available such as 'video/webm' for instance, see the doc for more info
      this.chunks = [];
      const file = new File ([blob], `${this.roomId}.webm`, { 'type' : 'video/webm' })
          // TODO: add link to redirect after end call

      var a = document.createElement("a"),
              url = URL.createObjectURL(file);
          a.href = url;
          a.download = 'meeting.webm';
          document.body.appendChild(a);
          a.click()
    },
    pushData (e) {
      this.chunks.push(e.data);
    },
    record () {
      this.mediaRecorder.start()
      
    },
    onHandleVideoOn () {
      this.videoOn = !this.videoOn;
      this.userStream.video = this.videoOn
      this.userStream.getVideoTracks()[0].enabled = this.videoOn;
    },
    onHandleMicOn () {
      this.micOn = !this.micOn;
      this.userStream.audio = this.micOn
      this.userStream.getAudioTracks()[0].enabled = this.micOn;
      if(this.micOn){
        this.startListening(this.userStream.id);
      } else {
        this.stopListening(this.userStream.id);
      }
    },
    stopListening(streamingId) {
      if (this.mediaStreamSource) {
          this.mediaStreamSource.disconnect();
          this.mediaStreamSource = null;
          this.analyser = null;
          this.isListening = false;
      }
      setTimeout(function(){
          this.videoContainer  = document.querySelector(`.video-item video[id='${streamingId}']`);
          if(this.videoContainer){
            this.videoContainer.style.border =  'none';
          }
      }, 1000)
    },
    startListening(streamingId) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 32;
          this.mediaStreamSource.connect(this.analyser);
          this.isListening = true;
          this.checkTalking(streamingId);
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });

    },
    checkTalking(streamingId) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const check = () => {
        if (!this.isListening) {
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);

        // Calculate the average volume
        const volume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

        // Adjust the threshold as per your requirement
        const threshold = 100;
        setTimeout(function(){
          this.videoContainer  = document.querySelector(`.video-item video[id='${streamingId}']`);
          
           if (volume > threshold && this.videoContainer) {
              this.videoContainer.style.border =  'thick solid #FF6B35';
              socket.emit('talking', { isTalking: true, sessionId: streamingId });
            } else {
              if(this.videoContainer){
                this.videoContainer.style.border =  'none';
              }
              socket.emit('talking', { isTalking: false, sessionId: streamingId });
            }
        }, 1000)
       

        requestAnimationFrame(check);
      };

      check();
    },
    async toggleRoom () {
      try {
        
        if(this.hasJoined) {
          const { data } = await axios.get( `https://livestream-backend-ng53ixt7xq-as.a.run.app/users/${this.userStream.id}`);
          console.log('data: ', data);
          if(data.data.isHost){
            this.dialog = true;
          } else {
            this.onDownloadLocal()
          }
        } else {
          await this.$refs.webrtc.join()
          this.userStream = this.$refs.webrtc.videoList[0].stream
          socket.emit('usersList', { roomId: this.roomId });
          socket.emit('join', { roomId: this.roomId, sessionId: this.userStream.id });
          this.startListening(this.userStream.id);
          this.getUserList();
         
          // Capture the entire screen
          const { data } = await axios.get( `https://livestream-backend-ng53ixt7xq-as.a.run.app/users/${this.userStream.id}`);
          console.log('data isHost: ', data, this.userStream.id);
        
          this.mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' }, audio: true, preferCurrentTab:true  });
          this.mediaRecorder = new MediaRecorder(this.mediaStream);

          const recordedChunks = [];

          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              console.log('data recordedChunks: ', recordedChunks, event);

              recordedChunks.push(event.data);
              this.pushData(event);
            }
          };

          this.mediaRecorder.onstop = () => {
            const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
            // this.onStop(this.userStream.id)
            const recordedVideo = this.$refs.recordedVideo;
            recordedVideo.src = URL.createObjectURL(recordedBlob);
            recordedVideo.controls = true;
          };

          this.mediaRecorder.start();
          this.isRecording = true;
            // this.mediaRecorder.ondataavailable = e => this.pushData(e)
            // this.mediaRecorder.onstop = () => this.onStop(this.userStream.id)
          this.hasJoined = true


          // Set an interval to stop recording and process the chunks
          const intervalId = setInterval(() => {
            if (this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.stop(); // Stop recording
              this.mediaRecorder.start(); // Resume recording

              // Process the recorded chunks here if needed
            }
          }, 5000); // Capture data every 5 seconds (adjust as needed)

          // Stop the recording after a specified duration (e.g., 30 seconds)
          setTimeout(() => {
            clearInterval(intervalId); // Clear the interval
            this.mediaRecorder.stop(); // Stop recording
          }, 30000); // Stop recording after 30 seconds (adjust as needed)
        }
      } catch (e) {
        alert(e)
      }

    },
    async getUserList(){
      // const { data } = await axios.get( `https://livestream-backend-ng53ixt7xq-as.a.run.app/users/list/${this.roomId}`);
      // this.userList = data;
    },
    screenShare () {
      try {
        this.$refs.webrtc.shareScreen()
      } catch (e) {
        alert('Screen share not available')
      }
    },
    async addTrack() {
      try {
        const streams = this.$refs.webrtc.videoList
        streams.forEach(stream => {
          this.userStream.addTrack(stream)
        })
      } catch (e) {
          alert(e)
      }
    },
    joinedRoom (streamId) {
      // this.addTrack(streamId)
      // document.querySelectorAll(`.video-item:not(:nth-child(1))`).forEach(el => {
      //     el.style.width = "30vw";
      //     el.style.height = "22vh";
      // });
      const newNode = document.createElement("p");

      newNode.setAttribute('class', 'user-video');
      const textNode = document.createTextNode(streamId);
      newNode.appendChild(textNode);

      setTimeout(function(){
        const list = document.getElementById(streamId);
        list.after(newNode, list.children[0]);
      }, 1000)
        
    },
    shareStarted (streamId) {
      console.log(streamId)
      // this.addTrack(streamId)
    },
    leftRoom (streamId) {
      // this.mediaRecorder.removeTrack(streamId)
      console.log(streamId)
    },
    async copyClipboard () {
      const baseUrl = window.location.origin
      await navigator.clipboard.writeText(`${baseUrl}/#${this.roomId}`)
      alert('Link copied to clipboard!')
    },
    async share () {
      const baseUrl = window.location.origin
      const shareData = {
        title: 'Vere-ai',
        text: 'Join my meeting!',
        url: `${baseUrl}/#${this.roomId}`
      }
      try {
      await navigator.share(shareData)
      } catch(err) {
      this.copyClipboard()
      }
    },
    async meetingRoomEndForEveryone() {
      const { data } = await axios.delete( `https://livestream-backend-ng53ixt7xq-as.a.run.app/users/list/${this.roomId}/${this.streamId}`);
      socket.emit('deleteUser', { roomId: this.roomId, sessionId: this.userStream.id });
      console.log('this.streamId}: ', this.streamId);
      console.log('meetingRoomEndForEveryone: ', data);
      this.onDownloadLocal()
    },
    async meetingRoomEnd() {
      const { data } = await axios.delete( `https://livestream-backend-ng53ixt7xq-as.a.run.app/users/list/${this.roomId}`);
      socket.emit('deleteUser', { roomId: this.roomId, sessionId: this.userStream.id });
      console.log('meetingRoomEnd: ', data);
      this.onDownloadLocal()
    },}
}
</script>

<style>
#room-input {
  margin-bottom: 3px;
}
#call-canvas {
  background-color: transparent;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

.v-btn>.v-btn__content .v-icon {
    font-size: 35px;
}
#join-btn {
  margin: 4px 2px;
}
.v-btn:not(.v-btn--round).v-size--default {
    height: 60px !important;
}
.video-webrtc-controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 60px;
    margin: auto;
}
::-webkit-media-controls {
    display: none;
}

.video-webrtc .video-item, .video-webrtc .video-item video {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-size: cover;
  object-fit: cover;
}
#call-canvas {
  display: grid;
  justify-content: end;
}
.video-container {
  display: flex;
  justify-content: end;
}
.video-item:nth-child(1) {
  order: 1;
  flex: 1;
  width: 100%;
  position: absolute;
}
.video-item:not(:nth-child(1)) {
  width: 400px;
  height: 280px;
  border-radius: 20px;
  top: 15px;
  position: relative;
  margin-bottom: 15px;
  right: 15px;
  flex: 1;
  order: 1;
}
.bg-red {
  background-color: #E74C3C !important;
  color: #fff !important;
}
.bg-primary {
  background-color: #1A1A1A !important;
  color: #fff !important;
}
img {
  height: 80px;
  width: 100%;
}
.user-video {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: #fff;
  font-size: 18px;
}
</style>
