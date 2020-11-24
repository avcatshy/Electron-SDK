import React, { Component } from 'react';
import AgoraRtcEngine from '../../../';
import { List } from 'immutable';
import path from 'path';
import os from 'os'

import {voiceChangerList, voiceReverbPreset, videoProfileList, audioProfileList, audioScenarioList, APP_ID, SHARE_ID, RTMP_URL, voiceReverbList, FU_AUTH } from '../utils/settings'
import {readImage} from '../utils/base64'
import WindowPicker from './components/WindowPicker/index.js'
import DisplayPicker from './components/DisplayPicker/index.js'
import {Rnd} from 'react-rnd'

const isMac = process.platform === 'darwin'

export default class App extends Component {

  constructor(props) {
    super(props)
    if (!APP_ID) {
      alert('APP_ID cannot be empty!')
    } else {
      let rtcEngine = this.getRtcEngine()
      this.state = {
        local: '',
        localVideoSource: '',
        transcoded: '',
        localSharing: false,
        users: new List(),
        channel: '',
        role: 1,
        voiceReverbPreset: 0,
        voiceChangerPreset: 0,
        videoDevices: rtcEngine.getVideoDevices(),
        audioDevices: rtcEngine.getAudioRecordingDevices(),
        audioPlaybackDevices: rtcEngine.getAudioPlaybackDevices(),
        camera: 0,
        mic: 0,
        speaker: 0,
        videoProfile: 43,
        showWindowPicker: false,
        showDisplayPicker: false,
        recordingTestOn: false,
        playbackTestOn: false,
        lastmileTestOn: false,
        rtmpTestOn: false,
        windowList: [],
        displayList: [],
        encoderWidth: 0,
        encoderHeight: 0,
        hookplayerpath: "",
        audioHookEnabled: false,
        progress: 0,
        sources: [],
        IsStartLocalVideoTranscoder: false
      }
    }
    this.enableAudioMixing = false;
  }

  getRtcEngine() {
    if(!this.rtcEngine) {
      this.rtcEngine = new AgoraRtcEngine()
      this.rtcEngine.initialize(APP_ID)
      // this.rtcEngine.setRenderMode(2)
      // this.rtcEngine.setLogFile("./agorartc.log")
      this.mediaPlayer = this.rtcEngine.createMediaPlayer();
      this.mediaPlayer.initEventHandler();
      this.mediaPlayer.on('onPlayerStateChanged', (state, ec)=>{
        console.log(`onPlayerStateChanged  state: ${state}  ec:${ec}`);
        if (state == 2) {
          let a = this.mediaPlayer.play();
          console.log(`mediaPlayer.play ${a}`);
          let a9 = this.mediaPlayer.getDuration()
          console.log(`mediaPlayer.getDuration ${a9}`);
          // let a10 = this.mediaPlayer.getState()
          // console.log(`mediaPlayer.getState ${a10}`);
          // let a2 = this.mediaPlayer.selectAudioTrack(0);
          // console.log(`mediaPlayer.selectAudioTrack ${a2}`);

        }
      })

      this.mediaPlayer.on('onPlayEvent', (event)=>{
        console.log(`onPlayEvent  event: ${event}`);
      })

      this.mediaPlayer.on('onPositionChanged', (position)=>{
        console.log(`onPositionChanged  position: ${position}`);
          // this.setState({
          //   mediaPlayerView: "mediaPlayerView"
          // })
      })

      this.rtcEngine.initializePluginManager();
      const libPath = isMac ? 
            path.resolve(__static, 'bytedance/libByteDancePlugin.dylib')
          : path.resolve(__static, 'bytedance/ByteDancePlugin.dll')
      if(this.rtcEngine.registerPlugin({
        id: 'bytedance',
        path: libPath
      }) < 0){
        console.error(`load plugin failed`)
      }
      this.subscribeEvents(this.rtcEngine)
      window.rtcEngine = this.rtcEngine;
    }

    return this.rtcEngine
  }

  componentDidMount() {
  }

  subscribeEvents = (rtcEngine) => {
    rtcEngine.on('joinedchannel', (connId, channel, uid, elapsed) => {
      console.log(`onJoinChannelSuccess connId:${connId} channel:${channel} uid: ${uid}`)
      this.setState({
        local: uid
      });
    });
    rtcEngine.on('userjoined', (connId, uid, elapsed) => {
      this.handleAddRemote(uid)
      this.setState({
        users: this.state.users.push({channelId: "", uid})
      })
    })
    rtcEngine.on('removestream', (connId, uid, reason) => {
      this.setState({
        users: this.state.users.filter(user => user.uid !== uid)
      })
    })
    rtcEngine.on('leavechannel', (connId) => {
      this.setState({
        local: ''
      })
    })
    rtcEngine.on('audiodevicestatechanged', (connId) => {
      this.setState({
        audioDevices: rtcEngine.getAudioRecordingDevices(),
        audioPlaybackDevices: rtcEngine.getAudioPlaybackDevices()
      })
    })
    rtcEngine.on('videodevicestatechanged', (connId) => {
      this.setState({
        videoDevices: rtcEngine.getVideoDevices()
      })
    })
    rtcEngine.on('audioVolumeIndication', (
      connId, 
      speakers,
      speakerNumber,
      totalVolume
    ) => {
      console.log(`connId:${connId} ${JSON.stringify(speakers)} speakerNumber${speakerNumber} totalVolume${totalVolume}`)
    })
    rtcEngine.on('error', (connId, err) => {
      console.error(err)
    })
  }

  handleJoin = () => {
    let encoderWidth = parseInt(this.state.encoderWidth)
    let encoderHeight = parseInt(this.state.encoderHeight)
    let rtcEngine = this.getRtcEngine()
    rtcEngine.setChannelProfile(1)
    rtcEngine.setClientRole(this.state.role)
    rtcEngine.registerMediaMetadataObserver();
    rtcEngine.setAudioProfile(0, 1)
    let logpath = path.resolve(__dirname, "./agoramain.sdk")

    rtcEngine.enableWebSdkInteroperability(true)
    if(encoderWidth === 0 && encoderHeight === 0) {

    } else {
      rtcEngine.setVideoEncoderConfiguration({width: encoderWidth, height: encoderHeight})
    }
    // rtcEngine.setVideoRenderDimension(3, 0, 640, 480)
    rtcEngine.setLocalVoiceChanger(this.state.voiceChangerPreset)
    rtcEngine.setLocalVoiceReverbPreset(this.state.voiceReverbPreset)
    rtcEngine.enableDualStreamMode(true)
    rtcEngine.enableAudioVolumeIndication(1000, 3, false)
   
    // rtcEngine.joinChannel("", "123", "", 0);
    let mediaOptions =  {
      publishCameraTrack: false,
      publishSecondaryCameraTrack: false,
      publishAudioTrack: true,
      publishScreenTrack: false,
      publishSecondaryScreenTrack: false,
      publishCustomAudioTrack: false,
      publishCustomVideoTrack: false,
      publishEncodedVideoTrack: false,
      publishMediaPlayerAudioTrack: false,
      publishMediaPlayerVideoTrack: false,
      publishTrancodedVideoTrack:true,
      autoSubscribeAudio: true,
      autoSubscribeVideo: true,
      publishMediaPlayerId: 0,
      enableAudioRecordingOrPlayout: true,
      clientRoleType: 1,
      defaultVideoStreamType: 0,
      channelProfile: 1
    }
    
    // let ret = rtcEngine.joinChannelWithMediaOptions("", "123", 0, mediaOptions)
    let ret = rtcEngine.joinChannelEx("", "123", 0, mediaOptions)
    console.log(`--------join channel: ${ret}`)
  }

  handleAddPrimaryCamera = () => {
    let deviceList = this.rtcEngine.getVideoDevices();
    console.log(`devices: ${JSON.stringify(deviceList)}`);
    let configuration = {
      cameraDirection: 0,
      deviceId: deviceList[0].deviceid,
      format: {
        width: 640,
        height: 480,
        fps: 30
      }
    }
    this.rtcEngine.startPrimaryCameraCapture(configuration)
    let sources = this.state.sources || []
    sources.push({
      sourceType: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0
    })
    this.setState({sources})
  }

  handleAddSecondaryCamera = () => {
    let deviceList = this.rtcEngine.getVideoDevices();
    console.log(`device2: ${deviceList[1].deviceid}`)
    let configuration = {
      cameraDirection: 0,
      deviceId: deviceList[1].deviceid,
      format: {
        width: 640,
        height: 480,
        fps: 30
      }
    }
    this.rtcEngine.startSecondaryCameraCapture(configuration)
    let sources = this.state.sources || []
    let device = this.state.videoDevices[1]
    sources.push({
      sourceType: 1,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0
    })
    this.setState({sources})
  }

  handleAddImage = () => {
    let sources = this.state.sources || []
    
    let filePath = path.resolve(__dirname, "../../static/plugin.png")
    sources.push({
      sourceType: 6,
      connectionId: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0,
      imageUrl: filePath
    })
    this.setState({sources})
  }

  handleAddJpg = () => {
    let sources = this.state.sources || []
  
    let filePath = path.resolve(__dirname, "../../static/jpg.jpg")
    sources.push({
      sourceType: 7,
      connectionId: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0,
      imageUrl: filePath
    })
    this.setState({sources})
  }

  handleAddGif = () => {
    let sources = this.state.sources || []
  
    let filePath = path.resolve(__dirname, "../../static/gif.gif")
    sources.push({
      sourceType: 8,
      connectionId: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0,
      imageUrl: filePath
    })
    this.setState({sources})
  }

  handleAddRemote = (uid) => {
    let sources = this.state.sources || []
    sources.push({
      sourceType: 9,
      connectionId: 0,
      remoteUserUid: uid,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0
    })
    this.setState({sources})
  }

  handleAddScreenShare = () => {
    let sources = this.state.sources || []
    sources.push({
      sourceType: 2,
      connectionId: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0
    })
    this.setState({sources})
  }

  handleAddPrimaryScreenCapture = () => {
    let windowList = this.rtcEngine.getScreenWindowsInfo();
    console.log(windowList);
    let config = {
      isCaptureWindow: false,
      displayId: 1,
      screenRect: {
        x: 12,
        y: 32,
        width: 343,
        height: 2323
      },
      windowId: 100,
      params: {
        width: 30,
        height: 23,
        frameRate: 30,
        bitrate: 100
      },
      regionRect: {
        x: 10,
        y: 10,
        width: 640,
        height: 360
      }
    }
    let ret = this.rtcEngine.startPrimaryScreenCapture(config)
    console.log(`startPrimaryScreenCapture ret --- ${ret}`)
    let sources = this.state.sources || []
    sources.push({
      sourceType: 2,
      connectionId: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0
    })
    this.setState({sources})
  }

  handleAddSecondaryScreenCapture = () => {
    let windowList = this.rtcEngine.getScreenWindowsInfo();
    console.log(windowList);
    let config = {
      isCaptureWindow: true,
      displayId: 1,
      screenRect: {
        x: 12,
        y: 32,
        width: 343,
        height: 2323
      },
      windowId: windowList[0].windowId,
      params: {
        width: 30,
        height: 23,
        frameRate: 30,
        bitrate: 100
      },
      regionRect: {
        x: 10,
        y: 10,
        width: 640,
        height: 360
      }
    }
    let ret = this.rtcEngine.startSecondaryScreenCapture(config)
    console.log(`startPrimaryScreenCapture ret --- ${ret}`)
    let sources = this.state.sources || []
    sources.push({
      sourceType: 3,
      connectionId: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0
    })
    this.setState({sources})
  }
  
  handleAddMediaPlayer = () => {
    let ret = this.mediaPlayer.open("https://big-class-test.oss-cn-hangzhou.aliyuncs.com/61102.1592987815092.mp4", 0);
    console.log(`Media palyer ret： ${ret}`);
    let sourceId = this.mediaPlayer.getSourceId();

    let sources = this.state.sources || []
    sources.push({
      sourceType: 5,
      connectionId: 0,
      x: 0,
      y: 0,
      width: 360,
      height: 240,
      zOrder: 1,
      alpha: 0,
      imageUrl: sourceId.toString(),
    })
    this.setState({sources})
  }

  calcTranscoderOptions = (sources) => {
    let videoInputStreams = sources.map(s => {
      return Object.assign({connectionId: 0}, s)
    })

    let videoOutputConfigurationobj = {
      width: 800,
      height: 600,
      frameRate: 15,
      bitrate: 0,
      minBitrate: -1,
      orientationMode: 0,
      degradationPreference: 0,
      mirrorMode: 0
    }

    return {
      streamCount: sources.length,
      videoInputStreams: videoInputStreams,
      videoOutputConfiguration: videoOutputConfigurationobj
    }
  }

  handlePreview = () => {
    let rtcEngine = this.getRtcEngine()
    rtcEngine.enableVideo()
    rtcEngine.setChannelProfile(1)
    rtcEngine.setClientRole(1)
    rtcEngine.setVideoEncoderConfiguration({width: 1080, height: 720})
    // rtcEngine.startPreview()
    // let displayId = this.rtcEngine.getScreenDisplaysInfo()[0].displayId
    // rtcEngine.startScreenCaptureByScreen(displayId, {x: 0, y: 0, width: 0, height: 0}, {width: 0, height: 0, bitrate: 500, frameRate: 5})

    let res = rtcEngine.startLocalVideoTranscoder(this.calcTranscoderOptions(this.state.sources))
    this.setState({
      IsStartLocalVideoTranscoder: true
    })
    console.log(`startLocalVideoTranscoder ${res}`)
  }

  handleUpdateTranscoder = (sources) => {
    rtcEngine.updateLocalTranscoderConfiguration(this.calcTranscoderOptions(sources || this.state.sources))
  }

  handleDragStop = (e,d) => {
    let {x, y, node} = d
    // console.log(`drag stop: id: ${node.id} ${x} ${y}`)
    // let sourceId = this.reverseSourceId(node.id)
    // this.updateSource(sourceId, {x: x, y: y})
  }
  
  handleDrag = (e,d) => {
    let {x, y, node} = d
    // console.log(`drag : id: ${node.id} ${x} ${y}`)
    let sourceId = this.reverseSourceId(node.id)
    this.updateSource(sourceId, {x: x, y: y})
  }

  handleResizeStop = (e, direction, ref, delta, position) => {
    let {width, height} = ref.style
    console.log(`resize stop: ${ref.id} ${width} ${height}`)
    let widthn = Number(width.replace("px", ""))
    let heightn = Number(height.replace("px", ""))
    let sourceId = this.reverseSourceId(ref.id)
    this.updateSource(sourceId, {width:widthn, height:heightn})
  }

  updateSource(idx, props) {
    if (!this.state.IsStartLocalVideoTranscoder)
      return;

    let {sources} = this.state
    sources[idx] = Object.assign(sources[idx], props)
    this.handleUpdateTranscoder(sources)
    this.setState(sources)
  }

  getSourceId(idx) {
    return `source-${idx}`
  }

  reverseSourceId(key) {
    return Number(key.split("-")[1])
  }

  render() {
    let windowPicker, displayPicker
    if (this.state.showWindowPicker) {
      windowPicker = <WindowPicker
        onSubmit={this.handleWindowPicker}
        onCancel={e => this.setState({showWindowPicker: false})}
        windowList={this.state.windowList}
      />
    }

    if (this.state.showDisplayPicker) {
      displayPicker = <DisplayPicker
        onSubmit={this.handleDisplayPicker}
        onCancel={e => this.setState({showWindowPicker: false})}
        displayList={this.state.displayList}
      />
    }

    let cameraSources = this.state.sources.filter(s => s.sourceType === 0)

    return (
      <div className="columns" style={{padding: "20px", height: '100%', margin: '0', background:"#8080"}}>
        { this.state.showWindowPicker ? windowPicker : '' }
        { this.state.showDisplayPicker ? displayPicker : '' }
        <div className="column is-one-quarter" style={{overflowY: 'auto'}}>
          <div className="field">
            <label className="label">Camera</label>
            <div className="control">
              <div className="select"  style={{width: '100%'}}>
                <select onChange={this.handleVoiceChanger} value={this.state.voiceChangerPreset} style={{width: '100%'}}>
                  {cameraSources.map(item => (<option key={item.deviceid} value={item.deviceid}>{item.name}</option>))}
                </select>
              </div>
            </div>
          </div>
          <div className="field">
            <label className="label">First Camera</label>
            <div className="control">
              {/* <div className="select"  style={{width: '100%'}}>
                <select onChange={this.handleVoiceChanger} value={this.state.voiceChangerPreset} style={{width: '100%'}}>
                  {cameraSources.map(item => (<option key={item.deviceid} value={item.deviceid}>{item.name}</option>))}
                </select>
              </div> */}
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddPrimaryCamera} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field">
            <label className="label">Second Camera</label>
            <div className="control">
              {/* <div className="select"  style={{width: '100%'}}>
                <select onChange={this.handleVoiceChanger} value={this.state.voiceChangerPreset} style={{width: '100%'}}>
                  {cameraSources.map(item => (<option key={item.deviceid} value={item.deviceid}>{item.name}</option>))}
                </select>
              </div> */}
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddSecondaryCamera} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field">
            <label className="label">Image: png</label>
            <div className="control">
              {/* <div className="select"  style={{width: '100%'}}>
                <select onChange={this.handleVoiceChanger} value={this.state.voiceChangerPreset} style={{width: '100%'}}>
                  {cameraSources.map(item => (<option key={item.deviceid} value={item.deviceid}>{item.name}</option>))}
                </select>
              </div> */}
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddImage} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field">
            <label className="label">Image: jpg</label>
            <div className="control">
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddJpg} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field">
            <label className="label">Image: gif</label>
            <div className="control">
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddGif} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field">
            <label className="label">First ScreenShare</label>
            <div className="control">
              {/* <div className="select"  style={{width: '100%'}}>
                <select onChange={this.handleVoiceChanger} value={this.state.voiceChangerPreset} style={{width: '100%'}}>
                  {cameraSources.map(item => (<option key={item.deviceid} value={item.deviceid}>{item.name}</option>))}
                </select>
              </div> */}
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddPrimaryScreenCapture} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field">
            <label className="label">Second ScreenShare</label>
            <div className="control">
              {/* <div className="select"  style={{width: '100%'}}>
                <select onChange={this.handleVoiceChanger} value={this.state.voiceChangerPreset} style={{width: '100%'}}>
                  {cameraSources.map(item => (<option key={item.deviceid} value={item.deviceid}>{item.name}</option>))}
                </select>
              </div> */}
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddSecondaryScreenCapture} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field">
            <label className="label">MediaPlayer</label>
            <div className="control">
              {/* <div className="select"  style={{width: '100%'}}>
                <select onChange={this.handleVoiceChanger} value={this.state.voiceChangerPreset} style={{width: '100%'}}>
                  {cameraSources.map(item => (<option key={item.deviceid} value={item.deviceid}>{item.name}</option>))}
                </select>
              </div> */}
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleAddMediaPlayer} className="button is-link">Add</button>
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handlePreview} className="button is-link">Preview</button>
            </div>
          </div>
          <div className="field is-grouped is-grouped-left">
            <div className="control">
              <button onClick={this.handleJoin} className="button is-link">JoinChannel</button>
            </div>
          </div>
        </div>

        <div className="column is-three-quarters window-container">
          <Window uid="0" rtcEngine={this.rtcEngine} role="transcoded" style={{width: 800, height:600, background:"#333"}}>
            {this.state.sources.map((s, idx) => (
              <Rnd id={`source-${idx}`} style={{"border":"1px dashed #fff"}} default={{
                x:s.x,
                y:s.y,
                width: s.width,
                height: s.height
              }} onDragStop={this.handleDragStop} onDrag={this.handleDrag} onResize={this.handleResizeStop}></Rnd>
            ))}
          </Window>
        </div>
      </div>
    )
  }
}

class Window extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  componentDidMount() {
    console.log(`componentDidMount-----`)
    let dom = document.querySelector(`#video-${this.props.channel || ""}-${this.props.uid}`)
    if (this.props.role === 'local') {
      console.log(`setupLocalVideo  -----`)
      dom && this.props.rtcEngine.setupLocalView(dom, 0)
      this.props.rtcEngine.setupViewContentMode('local', 1)
    } else if (this.props.role === 'localVideoSource') {
      dom && this.props.rtcEngine.setupLocalView(dom, 1)
      this.props.rtcEngine.setupViewContentMode('videosource', 1);
    } else if (this.props.role === 'remote') {
      this.props.rtcEngine.setupRemoteVideo(this.props.uid, dom)
      this.props.rtcEngine.setupViewContentMode('remote', 1);
    } else if (this.props.role === 'remoteVideoSource') {
      dom && this.props.rtcEngine.subscribe(this.props.uid, dom)
      this.props.rtcEngine.setupViewContentMode('videosource', 1);
    } else if (this.props.role === 'transcoded') {
      dom && this.props.rtcEngine.setupLocalView(dom, 4)
      this.props.rtcEngine.setupViewContentMode('transcoded', 1)
    }
  }

  render() {
    return (
      <div style={this.props.style || {}}>
        <div className="video-item" id={`video-${this.props.channel || ""}-${this.props.uid}`}>
          {this.props.children}
        </div>
      </div>
    )
  }
}