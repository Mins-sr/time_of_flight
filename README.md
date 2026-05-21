# iToF Learning Dashboard

GitHub Pagesで公開する、indirect Time-of-Flightを学ぶための静的ダッシュボードです。

## 内容

- 10 MHz変調で、往復時間を位相遅れに変える流れ
- `D = φ / 360 x c / (2f)` による距離復元
- 640 x 480 px の単純なiToF世界
- 1mから8mに置いた20cm立方体の位相表
- hTOFの粗いゲートと細かい割合 `N3 / (N2 + N3)` の例

## ローカル起動

```bash
npm start
```

Open <http://localhost:4173>.

## テスト

```bash
npm test
npm run coverage
```

## GitHub Pages

このリポジトリは静的HTML/CSS/JavaScriptだけで動きます。GitHub Pagesのsourceを `main` branchのrootに設定すると公開できます。
