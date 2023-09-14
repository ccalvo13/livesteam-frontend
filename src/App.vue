<template>
  <div id="app">
   
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
    }
  },
  mounted () {
    socket.on('talking', ({ sessionId, isTalking }) => {
      console.log('isTalking: ', isTalking, sessionId);
        this.videoContainer  = document.querySelector(`.video-item video[id='${sessionId}']`);
        
        // styling for video border: when user is talking
        if (isTalking) {
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
    console.log('created isTalking: ');
    // socket.on('talking', ({ sessionId, isTalking }) => {
    //   console.log('isTalking: ', isTalking, sessionId);
    // });
  },
  methods: {
    async onStop () {
      var blob = new Blob(this.chunks, { 'type' : 'video/webm' }); // other types are available such as 'video/webm' for instance, see the doc for more info
      this.chunks = [];
      const file = new File ([blob], `${this.roomId}.webm`, { 'type' : 'video/webm' })
    
      console.log('data 1: ', file);
      let formdata = new FormData();
      formdata.append('fileName', `${this.roomId}`)
      formdata.append('file', file)

      const { data } = await axios.post( 'https://livestream-backend-ng53ixt7xq-as.a.run.app/files', formdata);
      console.log('data: ', data, formdata);

    },
    pushData (e) {
      this.chunks.push(e.data);
    },
    record () {
      this.mediaRecorder.start()
    },
    onHandleVideoOn () {
      this.videoOn = !this.videoOn;
      // this.userStream = this.$refs.webrtc.videoList[0].stream
      this.userStream.video = this.videoOn
      console.log('this.userStream: ', this.userStream);
      this.userStream.getVideoTracks()[0].enabled = this.videoOn;
    },
    onHandleMicOn () {
      this.micOn = !this.micOn;
      console.log('this.micOn: ', this.micOn);
      // this.userStream = this.$refs.webrtc.videoList[0].stream
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
          this.videoContainer.style.border =  'none';
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
              // console.log('User is talking', this.analyser);
              socket.emit('talking', { isTalking: true, sessionId: streamingId });
              console.log('streamingId: ', streamingId);
            } else {
              if(this.videoContainer){
                this.videoContainer.style.border =  'none';
              }
              socket.emit('talking', { isTalking: false, sessionId: streamingId });
              // console.log('User is not talking', this.analyser);
            }
        }, 1000)
       

        requestAnimationFrame(check);
      };

      check();
    },
    async toggleRoom () {
      try {
        if(this.hasJoined) {
          this.$refs.webrtc.leave()
          this.hasJoined = false
          this.stopListening();
          this.mediaRecorder.stop()
        } else {
          await this.$refs.webrtc.join()
          this.userStream = this.$refs.webrtc.videoList[0].stream
          console.log('join: ', this.roomId, this.userStream.id );
          
          socket.emit('join', { roomId: this.roomId, sessionId: this.userStream.id });
          console.log('this.$refs.webrtc: ', this.$refs.webrtc);
          this.startListening(this.userStream.id);
          this.getUserList();
          this.mediaRecorder = new MediaRecorder(this.userStream)
          this.mediaRecorder.start()
          this.mediaRecorder.ondataavailable = e => this.pushData(e)
          this.mediaRecorder.onstop = () => this.onStop()
          this.hasJoined = true
        }
      } catch (e) {
        alert(e)
      }

    },
    async getUserList(){
      const { data } = await axios.get( `https://livestream-backend-ng53ixt7xq-as.a.run.app/users/list/${this.roomId}`);
      console.log('getUserList: ', data);
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
      console.log(streamId)
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
    }
  }
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
</style>
