import * as React from "react";
import { AsyncStorage, Keyboard, View, Image, FlatList, StyleSheet, Text } from "react-native";
import { Provider as PaperProvider, Appbar, TextInput, ActivityIndicator, Colors, Button, Menu } from 'react-native-paper';
import axios from 'axios';
import { useNetInfo } from "@react-native-community/netinfo";

function imageRenderItem(item, numColumn) {
  return (
    <Image
      style={styles.imagestyle}
      source={{ uri: item.photo_url }}
      style={{ aspectRatio: 1, flex: 1 / numColumn }}
    />
  );
}

export default function App() {

  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0)
  const [totalImage, setTotalImage] = React.useState(0);
  const [photoList, setPhotoList] = React.useState([]);
  const [hideSearch, setHideSearch] = React.useState(false);
  const [searchtext, setSearchText] = React.useState('');
  const [numColumn, setNumColumn] = React.useState(2)
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)
  const netInfo = useNetInfo();

  const _handleSearch = () => {
    Keyboard.dismiss();
    hideSearch ? setHideSearch(false) : setHideSearch(true)
  }

  const searchData = async (value, page) => {
    Keyboard.dismiss();
    if ((value || value !== 'undefined') && loading) {
      console.log(netInfo.isConnected)
      let dataList = await AsyncStorage.getItem(value.toLowerCase())
      if (netInfo.isConnected) {
        let photoData = null
        if (dataList) {
          photoData = JSON.parse(dataList)
        }
        setLoading(false)
        let res = await axios.get(`https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=8af79e0923b3d3dd470bd28122a937dc&text=${value.toLowerCase()}&page=${page + 1}&format=json&nojsoncallback=1`);
        const _photoList = res.data.photos.photo;
        if (_photoList.length > 0) {
          if (photoData) {
            photoData.photo.push(...res.data.photos.photo)
            await AsyncStorage.setItem(value.toLowerCase(), JSON.stringify(photoData));
          }
          else {
            await AsyncStorage.setItem(value.toLowerCase(), JSON.stringify(res.data.photos));
          }
        }
      }
      dataList = await AsyncStorage.getItem(value.toLowerCase())
      if (dataList) {
        let photoData = JSON.parse(dataList)
        setTotal(photoData.total)
        let photoList = photoData.photo;
        photoList.map((data, index) => {
          data.photo_url = `https://farm${data.farm}.staticflickr.com/${data.server}/${data.id}_${data.secret}.jpg`
          data.photo_id = index
        })
        setTotalImage(photoList.length)
        setPage(photoData.page)
        setPhotoList(photoList)
        setLoading(true)
      }
      else {
        setTotal(0)
        setTotalImage(0)
        setPage(1)
        setPhotoList([])
      }
    }
  }

  const onHideMenu = () => {
    setOpen(false)
    Keyboard.dismiss();
  }

  const onShowMenu = () => {
    setOpen(true)
    Keyboard.dismiss();
  }

  const changeGrid = (num) => {
    setNumColumn(num)
    setOpen(false)
    Keyboard.dismiss();
  }

  return (
    <PaperProvider>
      <View style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.Content title="Flickr App" />
          <Appbar.Action icon="magnify" onPress={_handleSearch} />
          <Menu
            onDismiss={onHideMenu}
            visible={open}
            anchor={
              <Appbar.Action
                color="white"
                icon="dots-vertical"
                onPress={onShowMenu}
              />
            }>
            <Menu.Item title="2 Grid" onPress={() => changeGrid(2)} />
            <Menu.Item title="3 Grid" onPress={() => changeGrid(3)} />
            <Menu.Item title="4 Grid" onPress={() => changeGrid(4)} />
          </Menu>
        </Appbar.Header>
        {
          hideSearch ?

            <View style={styles.imagestyle}>
              <TextInput
                mode='outlined'
                label="Search Photo"
                placeholder="Enter Search Photo"
                value={searchtext}
                onChangeText={(text) => { setSearchText(text) }}
              />
              <Button style={{ marginTop: 10 }} mode="contained"
                onPress={() => {
                  searchData(searchtext, 1);
                }}>
                Search</Button>
            </View> : null
        }{
          photoList.length !== 0 ?
            <FlatList
              key={numColumn == 2 ? 'TWO COLUMN' : numColumn == 3 ? 'THREE COLUMN' : 'FOUR COLUMN'}
              style={styles.imagestyle}
              data={photoList}
              onEndReachedThreshold={0.01}
              onEndReached={info => {
                if (netInfo.isConnected && (total === 0 || totalImage === 0 || total !== totalImage)) {
                  searchData(searchtext, page)
                }
              }}
              renderItem={({ item }) => imageRenderItem(item, numColumn)}
              keyExtractor={(item) => item.photo_id}
              numColumns={numColumn}
            /> : <Text style={styles.notext}>Here No Photo!</Text>
        }
        {
          !loading ? <ActivityIndicator animating={true} color={Colors.red800} /> : null
        }
      </View>

    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 0,
    flexDirection: "row"
  },
  inputWrap: {
    flex: 4,
    borderColor: "#cccccc",
    borderBottomWidth: 1,
    marginBottom: 10
  },
  searchButton: {
    flex: 3,
    borderColor: "#cccccc",
    borderBottomWidth: 1,
    marginBottom: 10
  },
  inputdate: {
    fontSize: 14,
    color: "#6a4595"
  },
  inputcvv: {
    fontSize: 14,
    color: "#6a4595"
  },
  notext: {
    marginTop: 10,
    textAlign: "center",
    fontWeight: 'bold'
  },
  searchtyle: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    flex: 1
  },
  imagestyle: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    flex: 0
  },
  searchSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  searchIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 0,
    backgroundColor: '#fff',
    color: '#424242',
  }
});
