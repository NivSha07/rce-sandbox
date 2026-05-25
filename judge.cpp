#include<bits/stdc++.h>
#include<winsock2.h>
#pragma comment(lib, "ws2_32.lib")

using namespace std;

void hC(SOCKET cs){
    char b[2048]={0};
    recv(cs,b,2048,0);
    string r(b);
    size_t d = r.find('|');
    if(d==string::npos) return;
    
    string l = r.substr(0,d);
    string f = r.substr(d+1);
    
    string lm = "--memory=\"256m\" --cpus=\"1\" --network none --pids-limit 64";
    string o = f+"_out.txt";
    string img = (l=="cpp"?"gcc:latest":l=="python"?"python:latest":"eclipse-temurin:latest");
    string ddir = (l=="java") ? "\"%cd%/"+f+"\"" : "\"%cd%\"";
    string sh = (l=="java") ? "runner.sh" : f+".sh";
    
    string c = "docker run --rm "+lm+" -v "+ddir+":/usr/src/app -w /usr/src/app "+img+" bash "+sh+" > "+o+" 2>&1";
    system(c.c_str());
    
    ifstream ifs(o);
    string res((istreambuf_iterator<char>(ifs)),(istreambuf_iterator<char>()));
    ifs.close();
    remove(o.c_str());
    
    send(cs,res.c_str(),res.length(),0);
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
    
    cout<<"[SYSTEM] Batch-Optimized C++ Judge Active on TCP 8080\n";
    
    while(true){
        SOCKET cs=accept(s,nullptr,nullptr);
        hC(cs);
    }
    
    WSACleanup();
    return 0;
}