import { VideoSourceType } from "./Private/AgoraBase";
import { RenderModeType } from "./Private/AgoraMediaBase";
import { IRtcEngine } from "./Private/IAgoraRtcEngine";
import { IRtcEngineEx } from "./Private/IAgoraRtcEngineEx";
import { IVideoDeviceManagerImpl } from "./Private/impl/IAgoraRtcEngineImpl";
import { IAudioDeviceManagerImpl } from "./Private/impl/IAudioDeviceManagerImpl";
import { RtcEngineExImplInternal } from "./Private/internal/RtcEngineExImplInternal";
import {
  AgoraEnvType,
  FormatRendererVideoConfig,
  RendererVideoConfig,
} from "./Types";

export const TAG = "[Agora]: ";
export const DEBUG_TAG = "[Agora Debug]: ";

export const deprecate = (originApi?: string, replaceApi?: string) =>
  logError(
    `${TAG} This method ${originApi} will be deprecated soon. `,
    replaceApi ? `Please use ${replaceApi} instead` : ""
  );

export const logWarn = (msg: string, ...optParams: any[]) => {
  if (!AgoraEnv.enableLogging) {
    return;
  }
  console.warn(`${TAG} ${msg}`, ...optParams);
};

export const logError = (msg: string, ...optParams: any[]) => {
  if (!AgoraEnv.enableLogging) {
    return;
  }
  console.error(`${TAG} ${msg}`, ...optParams);
};

export const logInfo = (msg: string, ...optParams: any[]) => {
  if (!AgoraEnv.enableLogging) {
    return;
  }
  console.log(`${TAG} ${msg}`, ...optParams);
};
export const logDebug = (msg: string, ...optParams: any[]) => {
  if (!AgoraEnv.enableLogging || !AgoraEnv.enableDebugLogging) {
    return;
  }
  console.warn(`${DEBUG_TAG} ${msg}`, ...optParams);
};

export const parseJSON = (jsonString: string) => {
  if (jsonString === "") {
    return jsonString;
  }
  let obj;
  try {
    obj = JSON.parse(jsonString);
  } catch (error) {
    logError("parseJSON", error);
  }
  return obj || jsonString;
};

export const objsKeysToLowerCase = (array: Array<any>) => {
  array.forEach((obj) => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const element = obj[key];
        obj[key.toLocaleLowerCase()] = element;
      }
    }
  });
};

export const changeEventNameForOnXX = (eventName: string) =>
  eventName.slice(2, 3).toLocaleLowerCase() + eventName.slice(3);

export const formatConfigByVideoSourceType = (
  videoSourceType?: VideoSourceType,
  originChannelId = "",
  originUid = 0
): {
  uid: number;
  channelId: string;
  videoSourceType: VideoSourceType;
} => {
  if (videoSourceType === undefined || videoSourceType === null) {
    throw new Error(`must set videoSourceType`);
  }
  let uid = originUid;
  let channelId = originChannelId;

  switch (videoSourceType) {
    case VideoSourceType.VideoSourceCamera:
    case VideoSourceType.VideoSourceCameraPrimary:
    case VideoSourceType.VideoSourceScreen:
    case VideoSourceType.VideoSourceScreenSecondary:
      channelId = "";
      uid = 0;
      break;
    case VideoSourceType.VideoSourceRemote:
      if (!uid || !channelId) {
        throw new Error(`must set uid:${uid}} and channelId:${channelId}`);
      }
      break;
    case VideoSourceType.VideoSourceMediaPlayer:
      channelId = "";
      if (!uid) {
        throw new Error(`must set uid(mediaPlayerId):${uid}}}`);
      }
      break;
    default:
      break;
  }
  return { uid, channelId, videoSourceType };
};

export const getDefaultRendererVideoConfig = (
  config: RendererVideoConfig
): FormatRendererVideoConfig => {
  const rendererOptions = Object.assign(
    {
      contentMode: RenderModeType.RenderModeFit,
      mirror: false,
    },
    config.rendererOptions
  );

  const { uid, channelId, videoSourceType } = formatConfigByVideoSourceType(
    config.videoSourceType,
    config.channelId,
    config.uid
  );

  return { ...config, uid, channelId, videoSourceType, rendererOptions };
};

export function classMix(...mixins: any[]): any {
  class MixClass {
    constructor() {
      for (let mixin of mixins) {
        copyProperties(this, new mixin()); // 拷贝实例属性
      }
    }
  }

  for (let mixin of mixins) {
    copyProperties(MixClass, mixin); // 拷贝静态属性
    copyProperties(MixClass.prototype, mixin.prototype); // 拷贝原型属性
  }

  return MixClass;
}

function copyProperties<T>(target: T, source: any) {
  for (let key of Reflect.ownKeys(source)) {
    if (key !== "constructor" && key !== "prototype" && key !== "name") {
      let desc = Object.getOwnPropertyDescriptor(source, key)!;
      Object.defineProperty(target, key, desc);
    }
  }
}

export const createAgoraRtcEngine = (): IRtcEngine &
  IRtcEngineEx &
  RtcEngineExImplInternal => new RtcEngineExImplInternal();

export const AgoraEnv: AgoraEnvType = {
  enableLogging: true,
  enableDebugLogging: false,
  isInitializeEngine: false,
  engineEventHandlers: [],
  mediaPlayerEventHandlers: [],
  AgoraAudioDeviceManager: new IAudioDeviceManagerImpl(),
  AgoraVideoDeviceManager: new IVideoDeviceManagerImpl(),
};

//@ts-ignore
(window || global).AgoraEnv = AgoraEnv;
