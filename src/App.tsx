import { useState } from "react";
import OpenLocationCode from "open-location-code-typescript";
import {
  Button,
  Container,
  Heading,
  Input,
  Link,
  List,
  ListItem,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ExternalLinkIcon, InfoIcon } from "@chakra-ui/icons";

const queryGsi = async (address: string) => {
  const res = await fetch(
    `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(
      address
    )}`
  );
  const resJson = await res.json();
  const [lon, lat]: [number, number] = resJson[0].geometry.coordinates;
  return { lon, lat };
};

const splitLocalPlusCode = (localPlusCode: string) => {
  const match = localPlusCode.match(/([A-Za-z0-9]+\+[A-Za-z0-9+]+)\s+(.*)/);
  return { localPlusCode: match?.[1], address: match?.[2] };
};

const yjcarnaviUrlFromPlusCode = async (plusCode: string) => {
  const { localPlusCode, address } = splitLocalPlusCode(plusCode);
  if (!localPlusCode || !address) {
    return "";
  }
  if (!OpenLocationCode.isValid(localPlusCode)) {
    return "";
  }
  const base = await queryGsi(address);

  const { latitudeCenter, longitudeCenter } = OpenLocationCode.decode(
    OpenLocationCode.recoverNearest(localPlusCode, base.lat, base.lon)
  );
  // https://map.yahoo.co.jp/blog/archives/20150202_carnavischeme.html
  return `yjcarnavi://navi/select?lat=${encodeURIComponent(
    latitudeCenter
  )}&lon=${encodeURIComponent(longitudeCenter)}`;
};

function App() {
  const [plusCodeInput, setPlusCodeInput] = useState<string>("");
  const [yjcarnaviUrl, setYjcarnaviUrl] = useState<string>("");

  const onSetPlusCodeInput = async (plusCode: string) => {
    setPlusCodeInput(plusCode);
    setYjcarnaviUrl(await yjcarnaviUrlFromPlusCode(plusCode));
  };

  return (
    <>
      <VStack justify="center" minH="100svh">
        <Container>
          <Heading fontSize="2xl">Plus Code to Yahoo! カーナビ</Heading>
        </Container>
        <Container marginTop="3">
          <Input
            type="text"
            value={plusCodeInput}
            onChange={(e) => onSetPlusCodeInput(e.target.value)}
            placeholder="MG6P+73 中之条町、群馬県"
          />
        </Container>
        <Container>
          <Button
            href={yjcarnaviUrl}
            as="a"
            isDisabled={!yjcarnaviUrl}
            colorScheme="red"
            rightIcon={<ExternalLinkIcon />}
            pointerEvents={yjcarnaviUrl ? "auto" : "none"}
          >
            Yahoo! カーナビでルート検索する
          </Button>
        </Container>
        <Container>
          <Text fontSize="xs" color="gray" minH="3em">
            {yjcarnaviUrl
              ? `${yjcarnaviUrl} を開きます`
              : "Google マップのアプリでコピーした Plus Code を入力してください (日本国内の地点のみ動作します)"}
          </Text>
        </Container>
        <Container marginTop="4">
          <List fontSize="sm">
            <ListItem>
              <Button
                as="a"
                href="https://support.google.com/maps/answer/7047426?hl=ja"
                variant="link"
                leftIcon={<InfoIcon />}
                target="_blank"
                rel="noopener noreferrer"
                color="gray"
                fontSize="xs"
              >
                Plus Code について (Google マップのヘルプ)
              </Button>
            </ListItem>
            <ListItem></ListItem>
            <ListItem marginTop="1.5">
              <Text color="grey" fontSize="xs">
                Plus Code の地名部分の検索に国土地理院の地名検索 API
                を利用しています。
                <br />
                Yahoo! カーナビとは無関係な非公式サービスです。
                <Link
                  href="https://github.com/polamjag/plus-code-to-yjcarnavi"
                  variant="link"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="gray"
                  fontSize="xs"
                  fontWeight="normal"
                  textDecoration="underline"
                >
                  このサイトについて
                </Link>
              </Text>
            </ListItem>
          </List>
        </Container>
      </VStack>
    </>
  );
}

export default App;
