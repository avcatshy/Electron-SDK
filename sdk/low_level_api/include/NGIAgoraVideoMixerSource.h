//
//  Agora SDK
//
//  Copyright (c) 2018 Agora.io. All rights reserved.
//

#pragma once  // NOLINT(build/header_guard)

#include "AgoraBase.h"
#include "AgoraRefPtr.h"
#include "IAgoraService.h"

namespace agora {
namespace rtc {

class IVideoTrack;

struct MixerLayoutConfig {
  int32_t top;
  int32_t left;
  int32_t width;
  int32_t height;
  int32_t zOrder; // larger zOrder prioritizes smaller ones
  float alpha;
  const char* image_path; // url of the place holder picture
};

enum ImageType {
  kPng,
  kJpeg,
  kGif
};

static const char* const LOCAL_CAMERA_TRACK_ID = "LocalCamera";
static const char* const LOCAL_SCREEN_TRACK_ID = "LocalScreen";
static const char* const LOCAL_CUSTOM_TRACK_ID = "LocalCustom";
static const char* const LOCAL_MEDIA_PLAYER_ID = "MediaPlayer";

/**
 * The IVideoMixerSource class abstracts a multi-in-multi-out video source which receives video
 * streams from multiple local or remote video tracks and generate mixed video stream in user defined output
 * format. When only one video track is added to the mixer, it simply forwards the incoming video frames
 * to its sinks.
 */
class IVideoMixerSource : public RefCountInterface {
public:
  /**
   * Add a video track for mixing.
   * @param id The unique id of the stream.
   * @param track The instance of the video track that you want mixer to receive its video stream.
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int addVideoTrack(const char* id, agora_refptr<IVideoTrack> track) = 0;
  /**
   * Remove the video track.
   * @param id The unique id of the stream.
   * @param track The instance of the video track that you want to remove from the mixer.
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int removeVideoTrack(const char* id, agora_refptr<IVideoTrack> track) = 0;
  /**
   * Configure the layout of video frames comming from a specific track (indicated by uid)
   * on the mixer canvas.
   * @param id The unique id of the stream.
   * @param config The layout configuration
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int setStreamLayout(const char* id, const MixerLayoutConfig& config) = 0;
  /**
   * Remove the user layout on the mixer canvas
   * @param id The unique id of the stream.
   * @param uid The uid of the stream.
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int delStreamLayout(const char* id) = 0;
  /**
   * Add a image source to the mixer with its layout configuration on the mixer canvas.
   * @param id The unique id of the image.
   * @param config The layout configuration
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int addImageSource(const char* id, const MixerLayoutConfig& config, ImageType type = kPng) = 0;
  /**
   * Delete a image source to the mixer.
   * @param id The unique id of the image.
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int delImageSource(const char* id) = 0;
  /**
   * Clear all the layout settings set previously
   */
  virtual void clearLayout() = 0;
  /**
   * Refresh the user layout on the mixer canvas
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int refresh() = 0;
  /**
   * Set the mixer canvas background to override the default configuration
   * @param width width of the canvas
   * @param height height of the canvas
   * @param fps fps of the mixed video stream
   * @param color_argb mixer canvas background color in argb
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int setBackground(uint32_t width, uint32_t height, int fps, uint32_t color_argb = 0) = 0;
  /**
   * Set the mixer canvas background to override the default configuration
   * @param width width of the canvas
   * @param height height of the canvas
   * @param fps fps of the mixed video stream
   * @param url URL of the canvas background image
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int setBackground(uint32_t width, uint32_t height, int fps, const char* url) = 0;
  /**
   * Set the rotation of the mixed video stream
   * @param rotation:0:none, 1:90°, 2:180°, 3:270° 
   * @return
   * 0 - Success
   * <0 - Failure
   */
  virtual int setRotation(uint8_t rotation) = 0;
};

} //namespace rtc
} // namespace agora
