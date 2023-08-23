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
        
          <vue-webrtc id="call-canvas" :roomId="roomId" ref="webrtc" v-on:share-started="shareStarted"  class="w-full video-webrtc" v-on:share-stopped="leftRoom" v-on:left-room="leftRoom" v-on:joined-room="joinedRoom" width="100%"/>
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

<script>
export default {
  name: 'App',
  data () {
    return {
      roomId: 'roomId',
      hasJoined: false,
      videoOn: true,
      micOn: true,
      mediaRecorder: {},
      chunks: [],
      userStream: {}
    }
  },
  mounted () {
    const hash =  window.location.hash
    if(hash != '') {
      this.roomId = hash.substring(1)
      this.toggleRoom()
    }
  },
  methods: {
    onStop () {
      var blob = new Blob(this.chunks, { 'type' : 'video/webm' }); // other types are available such as 'video/webm' for instance, see the doc for more info
      this.chunks = [];
      const file = new File ([blob], `${this.roomId}.webm`, { 'type' : 'video/webm' })
      var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = `${this.roomId}.webm`;
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
    },
    onHandleMicOn () {
      this.micOn = !this.micOn;
      var audio = document.createElement("call-canvas");
      audio.muted = this.micOn;
    },
    async toggleRoom () {
      try {
        if(this.hasJoined) {
          this.$refs.webrtc.leave()
          this.hasJoined = false
          this.mediaRecorder.stop()
        } else {
          await this.$refs.webrtc.join()
          this.userStream = this.$refs.webrtc.videoList[0].stream
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

.video-webrtc .video-item, .video-webrtc .video-item video {
  width: 100vw;
  height: 100vh;
}
.bg-red {
  background-color: red !important;
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
