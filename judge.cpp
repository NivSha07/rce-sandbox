#include<bits/stdc++.h>
#include<winsock2.h>
#pragma comment(lib, "ws2_32.lib")

using namespace std;
using namespace std::chrono;

void hC(SOCKET cs){
    char b[2048]={0};
    recv(cs,b,2048,0);
    string r(b);
    size_t d=r.find('|');
    if(d==string::npos) return;
    
    string l=r.substr(0,d);
    string f=r.substr(d+1);
    string c="";
    string lm="--memory=\"256m\" --cpus=\"1\"";
    string o=f+"_out.txt";
    
    if(l=="cpp") c="docker run --rm "+lm+" -v \"%cd%:/usr/src/app\" -w /usr/src/app gcc:latest bash -c \"g++ "+f+".cpp -o "+f+".out && timeout 5s ./"+f+".out < "+f+".txt\" > "+o+" 2>&1";
    else if(l=="python") c="docker run --rm "+lm+" -v \"%cd%:/usr/src/app\" -w /usr/src/app python:latest bash -c \"timeout 5s python "+f+".py < "+f+".txt\" > "+o+" 2>&1";
    else if(l=="java") c="docker run --rm "+lm+" -v \"%cd%/"+f+":/usr/src/app\" -w /usr/src/app eclipse-temurin:latest bash -c \"javac Main.java && timeout 5s java Main < input.txt\" > "+o+" 2>&1";
    else if(l=="javascript") c="docker run --rm "+lm+" -v \"%cd%:/usr/src/app\" -w /usr/src/app node:latest bash -c \"timeout 5s node "+f+".js < "+f+".txt\" > "+o+" 2>&1";
    else if(l=="rust") c="docker run --rm "+lm+" -v \"%cd%:/usr/src/app\" -w /usr/src/app rust:latest bash -c \"rustc "+f+".rs && timeout 5s ./"+f+" < "+f+".txt\" > "+o+" 2>&1";
    
    auto st=high_resolution_clock::now();
    system(c.c_str());
    auto en=high_resolution_clock::now();
    auto t=duration_cast<milliseconds>(en-st).count();
    
    ifstream ifs(o);
    string res((istreambuf_iterator<char>(ifs)),(istreambuf_iterator<char>()));
    ifs.close();
    remove(o.c_str());
    
    string msg=to_string(t)+"|"+res;
    send(cs,msg.c_str(),msg.length(),0);
    closesocket(cs);
}

int main(){
    WSADATA w;
    WSAStartup(MAKEWORD(2,2),&w);
    SOCKET s=socket(AF_INET,SOCK_STREAM,0);
    sockaddr_in a;
    a.sin_family=AF_INET;
    a.sin_port=htons(8080);
    a.sin_addr.s_addr=INADDR_ANY;
    bind(s,(struct sockaddr*)&a,sizeof(a));
    listen(s,10);
    
    cout<<"[SYSTEM] C++ Judge Daemon Active on TCP 8080\n";
    
    while(true){
        SOCKET cs=accept(s,nullptr,nullptr);
        hC(cs);
    }
    
    WSACleanup();
    return 0;
}