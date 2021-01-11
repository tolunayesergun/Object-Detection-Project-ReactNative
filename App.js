import React, { useState, useEffect } from "react";
import {
  Button,
  Image,
  View,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";

export default function ImagePickerExample() {
  const [image, setImage] = useState(null);
  const [type, setTypeCam] = useState(Camera.Constants.Type.back);
  const [open, setOpen] = useState(false);
  const [camera, setCamera] = useState(null);
  const [reScan, setReScan] = useState(true);
  const [objecCount, setObjecCount] = useState(0);

  const [items, setItems] = useState([]);
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const {
          status,
        } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const { statusCam } = await Camera.requestPermissionsAsync();
        if (status !== "granted" && statusCam !== "granted") {
          alert("Kamera ve Resim Görme Yetkisi Gerekmektedir!");
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    const manipResult = await ImageManipulator.manipulateAsync(
      result.uri,
      [{ resize: { width: 300, height: 300 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    setReScan(false);
    googleApi(manipResult.base64);

    if (!result.cancelled) {
      setImage(result.uri);
      setOpen(false);
    }
  };

  const openCamera = async () => {
    setOpen(!open);
    setImage(null);
  };

  const refreshPage = () => {
    setItems([]);
    setReScan(true);
    setImage(null);
  };

  const takePic = async () => {
    if (camera) {
      const options = { quality: 0.5, base64: true };
      let photo = await camera.takePictureAsync(options);

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 300, height: 300 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      setReScan(false);
      googleApi(manipResult.base64);

      if (!photo.cancelled) {
        setImage(photo.uri);
        setOpen(false);
      }
    }
  };

  const googleApi = async (base64) => {
    base64 = base64.replace("data:image/jpeg;base64,", "");

    let googleVisionRes = await fetch(
      "visionApoURL:images:annotate?key=" +
        "VisionApiKey",
      {
        method: "POST",
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64,
              },
              features: [{ type: "OBJECT_LOCALIZATION", maxResults: 50 }],
            },
          ],
        }),
      }
    );

    await googleVisionRes
      .json()
      .then((googleVisionRes) => {
        console.log("googleVisionRes.responses : " + googleVisionRes.responses);
        for (let item of googleVisionRes.responses) {
          let objectIndex = 0;
          for (let subitem of item.localizedObjectAnnotations) {
            objectIndex++;

            let objectItem = {
              key: "object" + objectIndex,
              name: subitem.name,
              score: subitem.score,
              top: 0,
              left: 0,
              width: 0,
              height: 0,
            };

            let index = 0;
            let preLeft = 0;
            let preTop = 0;
            for (let subsubitem of subitem.boundingPoly.normalizedVertices) {
              if (index == 0) {
                preTop = subsubitem.y * 300;
                objectItem.top = preTop;
                preLeft = subsubitem.x * 300;
                objectItem.left = preLeft;
              } else if (index == 1) {
                let l2 = subsubitem.x * 300;
                let rs = l2 - preLeft;
                objectItem.width = rs + 1;
              } else {
                let t2 = subsubitem.y * 300;
                let rst = t2 - preTop;
                objectItem.height = rst + 1;
                break;
              }
              index++;
            }
            items.push(objectItem);
            setObjecCount(objectIndex);
            forceUpdate();
            setReScan(false);
          }
        }
      })
      .catch((error) => {});
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View style={{ marginTop: 10, width: 200 }}>
        {reScan ? <Button title="Resim Seç" onPress={pickImage} /> : null}
      </View>
      <View style={{ marginTop: 10, width: 200, marginBottom: 10 }}>
        {reScan ? (
          <Button
            title={open ? "Kamerayı Kapat" : "Kamerayı Aç"}
            onPress={openCamera}
          />
        ) : null}
      </View>
      <View>
        {image &&
          items.map((el) => (
            <View
              key={el.key}
              style={{
                height: el.height,
                width: el.width,
                backgroundColor: "rgba(52, 52, 52, 0)",
                borderColor: "#39FF14",
                borderWidth: 1,
                position: "absolute",
                zIndex: 99,
                top: el.top,
                left: el.left,
                fontSize: 13,
              }}
            >
              <Text style={{ color: "#39FF14", textShadowColor: "white" }}>
                {el.name}
              </Text>
            </View>
          ))}
        {image && (
          <Image
            source={{ uri: image }}
            resizeMode="stretch"
            style={{ width: 300, height: 300 }}
          />
        )}
        {image && (
          <Text style={{ color: "black" }}>Nesne Sayısı : {objecCount}</Text>
        )}
        {image && <Text style={{ width: 300, height: 300 }} />}
      </View>
      {open ? (
        <View style={{ width: 300, height: 300 }}>
          <Camera
            ref={(ref) => {
              setCamera(ref);
            }}
            title="camera"
            type={type}
            style={{ width: 300, height: 300 }}
          >
            <View>
              <TouchableOpacity
                style={{ flex: 1, alignItems: "center" }}
                onPress={() => {
                  setTypeCam(
                    type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back
                  );
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    textShadowColor: "rgba(0, 0, 0, 0.75)",
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 10,
                  }}
                >
                  {" "}
                  Kamera Değiştir{" "}
                </Text>
              </TouchableOpacity>
            </View>
          </Camera>
          <View>
            <Button title="Fotoğraf  Çek" onPress={takePic} />
          </View>
        </View>
      ) : null}
      <View style={{ marginTop: 10, width: 200 }}>
        {!reScan ? <Button title="Sıfırla" onPress={refreshPage} /> : null}
      </View>
    </View>
  );
}
