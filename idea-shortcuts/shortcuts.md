IntelliJ IDEA 자주쓰는 단축키 모음
===================  
<br> <br> <br> <br> <br> <br> <br> <br>
  
  >   * `@author Tansan Man(tansan5150)`    
  >   * `@up to date 2023.07.21` 
    
<br>
<br>
[![Creative Commons Korea](https://ccl.cckorea.org/images/ico-cc.png)](https://creativecommons.org/licenses/by/2.0/kr/)  
본 웹사이트는 크리에이티브 커먼즈 저작자표시 2.0 대한민국 라이선스에 따라 이용할 수 있습니다.  

<br>
--------------------------------------

<br> 
### 목차
<br>
  > &nbsp; [1. IDE 화면 조작](#1-ide)   
  > &nbsp; [2. 찾기, 검색 및 바꾸기](#2)   
  > &nbsp; [3. Bookmark 기능](#3-bookmark)   
  > &nbsp; [4. Editor 편집 - 기본](#4-editor-)   
  > &nbsp; [5. Editor 편집 - 다중선택, 세로열](#5-editor-)   
  > &nbsp; [6. 코딩](#6)   
  > &nbsp; [[참고] 전체 단축키 모음](#_4)   

  <br> <br> <br> <br>
--------------------------------------
  <br>

### 1. IDE 화면 조작
#### 1.1 IDE 조작 기본
| 기능 | 단축키|비고 |
|-------|:-------:|------|
| 우측 Project 탐색창 이동<br> 코드 에디터 이동 |  `ALT+1` <br>  `ESC` | |
| 탭이동 - 최근연탭<BR>탭이동 - 순서대로 | `CTRL+SHIFT`<br>`ALT + ←/→`  | |
| 최근 연 파일 및 메뉴<br>최근 Editor 작업 위치 | `CTRL+E`<br>`CTRL+SHIFT+E`  | |
| 새로(NEW) 만들기| `ALT+INS`  |현재 위치에 적합한 새 개체 목록|
| 좌측 또는 하단 창 닫기| `SHIFT+ESC` | |
| 환경설정 - 전체| `CTRL+ALT+S` | |
| Project/Module 환경 설정| `F4` |Project 창에서 Project/Module 명 선택 후 |

<br>

#### 1.2 주요 도구 창 열기(참고)
| 기능 | 단축키|비고 |
|-------|:-------:|------|
| Find 콘솔 보기/닫기 | `ALT+3`  | |
| Run 콘솔 보기/닫기 | `ALT+4` | |
| Debug 콘솔 보기/닫기 | `ALT+5` | |
| Problem 콘솔 보기/닫기 | `ALT+6` | |
| Java Structure 보기/닫기 | `ALT+7` | |
| Service 보기/닫기 | `ALT+8` | |
| Version Control 보기/닫기 | `ALT+9` | VCS 연동 시 Git, SVN로 표시|
| Terminal 보기/닫기 | `ALT+F12` |Secure CRT 대신 사용 가능 |

<br>

### 2. 찾기, 검색 및 바꾸기

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
| Search Everywhere | `SHIFT` * 2 | 파일, 메뉴, Method(Symbol) 또는 IDE 기능 등|
| Find in Files |  `CTRL+SHIFT+F` | Project 내 모든 파일에서 찾기(단어, 변수 등) |
| Replace in Files |  `CTRL+SHIFT+R` | Project 내 모든 파일대상 바꾸기 |
| 찾기<br>바꾸기 | `CTRL+F`<br>`CTRL+R`|현재 Editor 창 대상 |
|다음 찾기<br>이전 찾기 |`F3` <br>`SHIFT+F3`|| 

<br>

### 3.  Bookmark 기능
| 기능 | 단축키| 비고 |
|------|:-------:|-------|
| Bookmark 보기<br>Bookmark Popup 보기| `ALT+2`<br>`SHIFT+F11` | |
| Bookmark 지정<br>Bookmark 숫자 지정| `F11`<br>`CTRL+F11` |0~9만 지정가능|
| Bookmark 이동| `CTRL+0~9` |숫자(mnemonic) 지정된 경우|

<br>

### 4. Editor 편집 - 기본
#### 4.1 Line 및 구간 선택
현재 커서 기준 선택으로 하여 줄/문단/범위 등을 선택 한다. 

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|줄선택| `SHIFT+UP/DOWN`||
|줄 시작까지 선택| `SHIFT+HOME`||
|줄 끝까지 선택| `SHIFT+END`||
|선택 확대<br>선택 축소| `CTRL+W`<br> `CTRL+SHIFT+W`||

<br>

#### 4.2 빈 Line 추가 및 이동
Line 추가는 현재 커서를 기준으로 위/아래에 추가하며, Line 이동 시는 한 줄 또는 선택한 범위의 Line이 이동 된다.

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|줄추가 - 아래로 |`SHIFT+ENTER`||
|줄추가 - 위로 |`CTRL+ALT+ENTER`||
|줄이동 - 그대로| `ALT+SHIFT+UP/DOWN`|들여쓰기 영향 안 받음|
|줄이동 - 들여쓰기| `CTRL+SHIFT+UP/DOWN`|들여쓰기에 맞게 조정|
|특정 Line 이동| `CTRL+G`|Line:Column 번호 형식|

<br>

#### 4.3 Line 삭제, 복사 및 합치기
한 줄 또는 선택한 범위의 Line을 복사, 삭제 할 수 있다.

| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|줄삭제|`CTRL+Y`| `CTRL+SHIFT+K` 로 변경 권장|
|줄복사|`CTRL+D`|| 
|줄합치기| `CTRL+SHIFT+J`||

<br>

#### 4.4 실행 취소(Undo)와 되돌리기(Redo)
| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|실행 취소(Undo)|`CTRL+Z`||
|되돌리기(Redo)|`CTRL+SHIFT+Z`|`CTRL+Y`로 변경 권장|

> Redo 단축키가 default 로 `CTRL+Y` 가 아닌 `CTRL+SHIFT+Z`로 되어 있다.  
> 그리고 `CTRL+Y` 는 Default로  줄삭제로 지정되어 있다.  
> Windows default 와 달라 매우 헛갈리는데 그냥 적응해도 되지만 단축키 변경으로 변경 한는 것도 좋은 방법 이다.  
> `Settings` > `Keymap` 에서 우측 상단 검색 창에 `redo`, `delete line` 과 같아 입력 하여 해당 단축 키를 바꿔 줄 수 있다.

<br>

### 5. Editor 편집 - 다중선택, 세로열
| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|단어 다중선택 추가|`ALT+J`||
|단어 다중선택 빼기|`ALT+SHIFT+J`||
|같은 단어 모두 선택|`CTRL+ALT+SHIFT+J`||
|임의 위치 다중 선택| `SHIFT+ALT+클릭`||
|세로열 편집 활성/해제| `SHIFT+ALT+INS`|  `마우스 드래그`또는 `SHIFT+방향키` 사용
|세로열 편집| `ALT+드래그`||

<br>

### 6. 코딩
#### 6.1 Editor 내 기능
| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|자동 완성| `CTRL+SPACE`||
|자동 수정(제안내용)| `ALT+ENTER`||
|참조 이동/확인| `CTRL+클릭`|상속 부모/자식, Interface/Impl. Annotation 등|
|참조 이동| `F4`||
|Getter/Setter 만들기 | `ALT+INS` > 선택 ||
|구문자동 완성|`Shift+Ctrl+Enter`| 문장 뒷 부분 ",',; 또는 ), } 등을 자동으로 완성|  
|한 줄 주석| `CTRL+/`|여러줄 선택 시 // 사용|
|블록 주석| `CTRL+SHIFT+/` | /* */ 사용|

<br>

#### 6.2 빌드 및 실행
| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|Build Project |`CTRL*F9`||
|Run |`SHIFT+F10`|상단 `Select Run Configurations` 선택 기준 |
|Run |`ALT+SHIFT+F10`|현재 활성창 기준 |
|Run Anything|`CTRL*2`|여러 Run Configurations 중 찾아서 선택 |
|APP(Tomcat) 중지|`CTRL+F2`| |
|APP(Tomcat) 재실행|`CTRL+F5`| |

<br>

#### 6.3 Debug
| 기능 | 단축키| 비고 |
|------|:-------:|-------|
|Debug |`SHIFT+F9`|상단 `Select Run Configuration` 선택 기준 |
|Debug |`ALT+SHIFT+F9`|현재 활성창 기준 |
|이전찾기<BR>다음찾기 |`F7`<br>`F8`||
|Resume |`F9`| |
|Break Point 찍기 |`CTRL+F8`| |
|Break Point 보기 |`CTRL+SHIFT+F8`| |

<br>

#### 6.4 Snippets 기능
|단축어  | 명령어| 비고 |
|:------:|-------|-------|
|psvm|public static void main(String[]args) \{\} | ||
|sout|System.out.println()||
|iter|for (Object o : ) \{\}||
|fori|for (int i = 0; i < ; i++) \{\}||
|if|if () ||
|ifn|if ( == null) \{\}||
|psf|public static final|psfs, psfi 사용가능|

<br>

### [참고] 전체 단축키 모음

- [Windows](./resources/ReferenceCard.pdf)
- [MacOS](./resources/ReferenceCardForMac.pdf)
