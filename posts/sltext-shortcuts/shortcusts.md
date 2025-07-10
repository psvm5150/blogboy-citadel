Sublime Text 4 자주쓰는 단축키 모음
===================  
<br> <br> <br> <br> <br> <br> <br> <br>
  
  >   * `@author Tansan Man(tansan5150)`    
  >   * `@up to date 2023.09.05 ` 
    
<br>

[![Creative Commons Korea](https://ccl.cckorea.org/images/ico-cc.png)](https://creativecommons.org/licenses/by/2.0/kr/)  
본 웹사이트는 크리에이티브 커먼즈 저작자표시 2.0 대한민국 라이선스에 따라 이용할 수 있습니다.  

<br>
--------------------------------------

<br> 

### 1. Editor 화면 기능
| 기능 | 단축키|비고 |
|-------|:-------:|------|
| 탭이동 - 최근연탭 |  `CTRL+TAB` |`TAB`을 누를때 마다 전, 전전, 전전전 식으로 이동|
| 탭이동 -  순서대로 | `CTRL+PGUP/PGDN` | |
| 탭이동 -  지정순서 | `ALT+1~9` |가장 좌측 탭부터 1, 9는 마지막 탭|
| 새(NEW) 문서| `CTRL+N` ||
| 창 분할/해제 - 탭간 비교| `CTRL+탭클릭` |이미 분할된 탭 클릭 시 해제|
| 창 분할| `ALT+SHIFT+2~4` |현재 탭 기준 빈창 분할. 우측 세로분할|
| 창 분할| `ALT+SHIFT+5,8,9` |현재 탭 기준 빈창 분할. 4등분 또는 가로분할|
| 창 분할 해제| `ALT+SHIFT+1` ||
| 전체화면| `F11` ||
| 집중모드| `SHIFT+F11` ||
| 화면 확대/축소| `CTRL`+`-/+` 또는<br> `CTRL`+`마우스휠` ||

<br>

### 2. 찾기, 검색 및 바꾸기

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|Command Palette|`CTRL+SHIFT+P`| 매뉴 또는 기능의 실행| 
| Symbol 찾기| `CTRL+R` | method, function, 장/절 등|
| 파일 찾기|  `CTRL+P` | Project 내 파일 찾기 |
| 특정 행 이동 |  `CTRL+G` | 원하는 Line 번호로 즉시 이동 |
| Find/Replace in Files |  `CTRL+SHIFT+F` | 지정위치 특정 단어 포함하는 모든 파일 찾기 |
| 찾기<br>바꾸기 | `CTRL+F`<br>`CTRL+H`|현재 Editor 창 대상 |
|다음 찾기<br>이전 찾기 |`F3` <br>`SHIFT+F3`|| 
|모두 찾기 |`ALT+ENTER`|| 

> `CTRL+RPG(Role Playing Game)` 만 연상해서 외우면 대부분 검색기능을 마스터 할 수 있다.

<br>

### 3. Editor 편집 - 기본

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|Line 선택|`CTRL+L`|계속 입력 시 여러줄 선택|
|Line 추가 - 아래|`CTRL+ENTER`||
|Line 추가 - 위|`CTRL+SHIFT+ENTER`||
|Line 합치기|`CTRL+SHIFT+J`|바로 아래줄과 합침|
|Line 복사|`CTRL+SHIFT+D`|여러줄 선택 복사 가능|
|Line 삭제|`CTRL+SHIFT+K`|여러줄 삭제 가능|
|현재 위치 뒤 삭제|`CTRL+K, K`|현재 위치부터 라인 끝까지 삭제|
|들여쓰기<br>내어쓰기|`TAB`<br>`SHIFT+TAB`|블록/문단 선택 후|
|대문자변환<br>소문자변환|`CTRL+K, U`<br>`CTRL+K, L`||

> `CTRL+K, U` 와 같은 입력은 `CTRL+K`를 누른후 `CTRL`키를 떼지않고 이어서 `U`를 누른다.

<br>

### 4. Editor 편집 - 다중선택, 세로열

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|단어 다중선택|`CTRL+D`|반복 시 다음 동일 단어 선택|
|단어 다중선택 제외|`CTRL+D,K`|단어 다중 선택에서 제외|
|단어 다중선택 해제|`CTRL+U`|반복 시 단어 선택 역순으로 해제|
|단어 다중선택 - 모두선택|`ALT+F3`||
|단어 다중선택 해제 - 모두해제|`ESC`||
|다중선택 - 마우스|`CTRL+SHIFT+우측클릭`|임의지점 다중 선택시 유용|
|다중선택 해제 - 마우스|`ALT+SHIFT+우측클릭`|임의지점 다중 선택시 유용|
|다중선택 시 대소문자 구분|`CTRL+F` > `ALT+C`|우측하단 `Aa` 버튼 선택/해제 됨|
|세로열 모드 - 키보드|`CTRL+ALT+UP/DOWN`||
|세로열 모드 - 마우스|`SHIFT+우클릭 드래그`||
|세로열 모드 - 선택블록/문단|`CTRL+SHIFT+L`|각 Line 마지막 선택 시 유용,<br>좌우 방향키로 각 Line 처음, 끝 선택 가능|

<br>

### 5. Editor 편집 - 라인정렬

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|오름차순 정렬 |`F9`|`Command Palette` > `Sort Lines`|
|오름차순 정렬 - 대소문자 구분 X |`CTRL+F9`|`Command Palette` > `Sort Lines(Case Sensitive)`|
|내림차순 정렬 ||`Command Palette` > `Permute Lines: Reverse`|
|랜덤 정렬 ||`Command Palette` > `Permute Lines: Shuffle`|
|중복값 제거 ||`Command Palette` > `Permute Lines: Unique`|

<br>

### 6. 개발 관련

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|자동완성 |`CTRL+SPACE`||
|Snippet 입력 |`TAB`|예: html > `TAB`|
|블럭 주석/취소 |`CTRL+SHIFT+/`||
|한줄 주석/취소 |`CTRL+/`||
|코드 펴기<br>코드 접기 |`CTRL+SHIFT+[`<br>`CTRL+SHIFT+]`||
|Build |`CTRL+B`|MD문서, HTML 미리보기 등|
|Hex Editor 모드 |`CTRL+SHIFT+H`|Plugin 필요|
|Node JS 실행 |`ALT+R`|Plugin 필요|
